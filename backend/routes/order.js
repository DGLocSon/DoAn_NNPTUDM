const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const cartSchema = require('../schemas/cart');
const cartItemSchema = require('../schemas/cart-item');
const orderSchema = require('../schemas/order');
const orderDetailSchema = require('../schemas/order-detail');
const inventorySchema = require('../schemas/inventory');
const paymentSchema = require('../schemas/payment');

const { CheckLogin } = require('../utils/authHandler');

// ================= CHECKOUT =================
router.post('/checkout', CheckLogin, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let cart = await cartSchema.findOne({
            userId: req.user._id,
            isDeleted: false
        });

        if (!cart) throw new Error("Cart not found");

        let items = await cartItemSchema.find({
            cartId: cart._id,
            isDeleted: false
        }).populate('bookId');

        if (items.length === 0) {
            throw new Error("Cart is empty");
        }

        let total = 0;

        let order = await orderSchema.create([{
            userId: req.user._id,
            addressId: req.body.addressId,
            totalAmount: 0
        }], { session });

        order = order[0];

        for (let item of items) {

            let inventory = await inventorySchema.findOne({
                bookId: item.bookId._id
            }).session(session);

            if (!inventory) {
                throw new Error("Inventory not found");
            }

            if (inventory.stock < item.quantity) {
                throw new Error(`Not enough stock for ${item.bookId.title}`);
            }

            inventory.stock -= item.quantity;
            inventory.soldCount += item.quantity;

            await inventory.save({ session });

            await orderDetailSchema.create([{
                orderId: order._id,
                bookId: item.bookId._id,
                quantity: item.quantity,
                price: item.bookId.price
            }], { session });

            total += item.quantity * item.bookId.price;
        }

        order.totalAmount = total;
        await order.save({ session });

        await paymentSchema.create([{
            orderId: order._id,
            method: req.body.method || "COD"
        }], { session });

        await cartItemSchema.updateMany(
            { cartId: cart._id },
            { isDeleted: true },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            data: order
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

// ================= GET ORDERS =================
router.get('/', CheckLogin, async (req, res) => {
    let orders = await orderSchema.find({
        userId: req.user._id
    }).populate('addressId');

    res.json({
        success: true,
        data: orders
    });
});

module.exports = router;