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


router.post('/checkout', CheckLogin, async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, phone, customerName, method } = req.body;

        // 1. Tìm giỏ hàng hiện tại
        let cart = await cartSchema.findOne({ userId: userId, isDeleted: false });
        if (!cart) throw new Error("Không tìm thấy giỏ hàng!");

        let items = await cartItemSchema.find({ cartId: cart._id, isDeleted: false }).populate('bookId');
        if (items.length === 0) throw new Error("Giỏ hàng của bạn đang trống!");

        // 2. Khởi tạo Đơn hàng
        let order = await orderSchema.create({
            userId: userId,
            shippingAddress: shippingAddress,
            phone: phone,
            customerName: customerName,
            totalAmount: 0 
        });

        let total = 0;

        // 4. Duyệt từng món hàng: Check kho -> Trừ kho -> Tạo Order Detail
        for (let item of items) {
            let inventory = await inventorySchema.findOne({ bookId: item.bookId._id });
            
            if (!inventory || inventory.stock < item.quantity) {
                throw new Error(`Sản phẩm [${item.bookId.title}] đã hết hàng hoặc không đủ số lượng!`);
            }

            // Trừ kho & Tăng số lượng đã bán
            inventory.stock -= item.quantity;
            inventory.soldCount += item.quantity;
            await inventory.save();

            // Tạo chi tiết đơn hàng (Lưu giá tại thời điểm mua)
            await orderDetailSchema.create({
                orderId: order._id,
                bookId: item.bookId._id,
                quantity: item.quantity,
                price: item.bookId.price
            });

            total += item.quantity * item.bookId.price;
        }

        // 5. Cập nhật tổng tiền đơn hàng
        order.totalAmount = total;
        await order.save();

        // 6. Tạo bản ghi Thanh toán & Vận chuyển
        await paymentSchema.create({
            orderId: order._id,
            method: method || "COD"
        });

        await shipmentSchema.create({
            orderId: order._id,
            status: "processing"
        });

        // 7. Dọn dẹp giỏ hàng (Soft Delete)
        await cartItemSchema.updateMany(
            { cartId: cart._id },
            { isDeleted: true }
        );

        res.status(201).json({ success: true, message: "Đặt hàng thành công!", data: order });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});


router.get('/', CheckLogin, async (req, res) => {
    try {
        let filter = {};
        
        // Nếu không phải admin, chỉ cho xem đơn hàng của chính mình
        await req.user.populate('role');
        const roleName = req.user.role?.name?.toUpperCase();
        
        if (roleName !== 'ADMIN') {
            filter.userId = req.user._id;
        } else if (req.query.userId) {
            filter.userId = req.query.userId;
        }

        let orders = await orderSchema.find(filter)
            .populate('userId', 'username email') // Populate thêm thông tin user cho admin
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.get('/:id', CheckLogin, async (req, res) => {
    try {
        const orderId = req.params.id;

        // Lấy thông tin cơ bản của đơn hàng (Không populate addressId nữa)
        const order = await orderSchema.findById(orderId);
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