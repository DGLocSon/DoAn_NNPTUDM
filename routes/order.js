const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import tất cả các Schemas cần thiết
const cartSchema = require('../schemas/cart');
const cartItemSchema = require('../schemas/cart-item');
const orderSchema = require('../schemas/order');
const orderDetailSchema = require('../schemas/order-detail');
const inventorySchema = require('../schemas/inventory');
const paymentSchema = require('../schemas/payment');
const shipmentSchema = require('../schemas/shipment');
const addressSchema = require('../schemas/address');

const { CheckLogin } = require('../utils/authHandler');
// Giả sử bạn có middleware CheckRole để chặn Admin
// const { CheckRole } = require('../utils/roleHandler'); 

/**
 * ======================================================
 * 1. [POST] CHECKOUT - Đặt hàng & Thanh toán
 * ======================================================
 */
router.post('/checkout', CheckLogin, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { addressId, method } = req.body;

        // 1. Kiểm tra địa chỉ hợp lệ
        const address = await addressSchema.findOne({
            _id: addressId,
            userId: userId,
            isDeleted: false
        }).session(session);
        if (!address) throw new Error("Địa chỉ giao hàng không hợp lệ!");

        // 2. Tìm giỏ hàng hiện tại
        let cart = await cartSchema.findOne({ userId: userId, isDeleted: false }).session(session);
        if (!cart) throw new Error("Không tìm thấy giỏ hàng!");

        let items = await cartItemSchema.find({ cartId: cart._id, isDeleted: false }).populate('bookId').session(session);
        if (items.length === 0) throw new Error("Giỏ hàng của bạn đang trống!");

        // 3. Khởi tạo Đơn hàng
        let order = await orderSchema.create([{
            userId: userId,
            addressId: addressId,
            totalAmount: 0 // Sẽ cập nhật sau khi tính toán
        }], { session });
        order = order[0];

        let total = 0;

        // 4. Duyệt từng món hàng: Check kho -> Trừ kho -> Tạo Order Detail
        for (let item of items) {
            let inventory = await inventorySchema.findOne({ bookId: item.bookId._id }).session(session);
            
            if (!inventory || inventory.stock < item.quantity) {
                throw new Error(`Sản phẩm [${item.bookId.title}] đã hết hàng hoặc không đủ số lượng!`);
            }

            // Trừ kho & Tăng số lượng đã bán
            inventory.stock -= item.quantity;
            inventory.soldCount += item.quantity;
            await inventory.save({ session });

            // Tạo chi tiết đơn hàng (Lưu giá tại thời điểm mua)
            await orderDetailSchema.create([{
                orderId: order._id,
                bookId: item.bookId._id,
                quantity: item.quantity,
                price: item.bookId.price
            }], { session });

            total += item.quantity * item.bookId.price;
        }

        // 5. Cập nhật tổng tiền đơn hàng
        order.totalAmount = total;
        await order.save({ session });

        // 6. Tạo bản ghi Thanh toán & Vận chuyển
        await paymentSchema.create([{
            orderId: order._id,
            method: method || "COD"
        }], { session });

        await shipmentSchema.create([{
            orderId: order._id,
            status: "processing"
        }], { session });

        // 7. Dọn dẹp giỏ hàng (Soft Delete)
        await cartItemSchema.updateMany(
            { cartId: cart._id },
            { isDeleted: true },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, message: "Đặt hàng thành công!", data: order });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: err.message });
    }
});

/**
 * ======================================================
 * 2. [GET] Lấy danh sách đơn hàng (Dành cho User tự xem)
 * ======================================================
 */
router.get('/', CheckLogin, async (req, res) => {
    try {
        let orders = await orderSchema.find({ userId: req.user._id })
            .populate('addressId')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * ======================================================
 * 3. [GET] CHI TIẾT ĐƠN HÀNG - Cho Admin hoặc User xem chi tiết
 * ======================================================
 */
router.get('/:id', CheckLogin, async (req, res) => {
    try {
        const orderId = req.params.id;

        // Lấy thông tin cơ bản của đơn hàng
        const order = await orderSchema.findById(orderId).populate('addressId');
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });

        // Bảo mật: Nếu không phải Admin thì chỉ được xem đơn hàng của chính mình
        // if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này!" });
        // }

        // Lấy đồng thời các thông tin liên quan để tối ưu tốc độ
        const [details, payment, shipment] = await Promise.all([
            orderDetailSchema.find({ orderId }).populate('bookId'),
            paymentSchema.findOne({ orderId }),
            shipmentSchema.findOne({ orderId })
        ]);

        res.json({
            success: true,
            data: {
                orderInfo: order,
                items: details,
                payment,
                shipment
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;