const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { CheckLogin, CheckRole } = require("../utils/authHandler");
const orderModel = require("../schemas/order");
const orderDetailModel = require("../schemas/order-detail");
const bookModel = require("../schemas/book");
const addressModel = require("../schemas/address");
const inventoryModel = require("../schemas/inventory");

const isAdmin = (roleName) => ["admin"].includes(roleName);

router.get("/", CheckLogin, async function (req, res) {
  try {
    const filter = { isDeleted: false };
    if (!isAdmin(req.user.role.name)) {
      filter.userId = req.user._id;
    }
    const orders = await orderModel
      .find(filter)
      .populate("userId", "username email")
      .populate("addressId");

    res.send(orders);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("/:id", CheckLogin, async function (req, res) {
  try {
    const order = await orderModel
      .findOne({ _id: req.params.id, isDeleted: false })
      .populate("userId", "username email")
      .populate("addressId");

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (!isAdmin(req.user.role.name) && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Access denied" });
    }

    const items = await orderDetailModel
      .find({ orderId: order._id, isDeleted: false })
      .populate("bookId", "title price");

    res.send({ order, items });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/", CheckLogin, async function (req, res) {
  const { addressId, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ message: "Order items are required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const address = await addressModel.findOne({
      _id: addressId,
      userId: req.user._id,
      isDeleted: false
    }).session(session);

    if (!address) {
      throw new Error("Invalid address");
    }

    const order = new orderModel({
      userId: req.user._id,
      addressId,
      totalAmount: 0,
      status: "pending"
    });

    await order.save({ session });

    let totalAmount = 0;
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.bookId || quantity <= 0) {
        throw new Error("Invalid order item");
      }

      const book = await bookModel.findOne({ _id: item.bookId, isDeleted: false }).session(session);
      if (!book) {
        throw new Error("Book not found");
      }

      const inventory = await inventoryModel.findOne({ bookId: book._id, isDeleted: false }).session(session);
      if (!inventory || inventory.stock < quantity) {
        throw new Error(`Insufficient stock for ${book.title}`);
      }

      inventory.stock -= quantity;
      inventory.soldCount += quantity;
      await inventory.save({ session });

      const detail = new orderDetailModel({
        orderId: order._id,
        bookId: book._id,
        quantity,
        price: book.price
      });
      await detail.save({ session });

      totalAmount += book.price * quantity;
    }

    order.totalAmount = totalAmount;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    const savedOrder = await orderModel
      .findById(order._id)
      .populate("addressId")
      .populate("userId", "username email");

    const savedItems = await orderDetailModel
      .find({ orderId: order._id, isDeleted: false })
      .populate("bookId", "title price");

    res.status(201).send({ order: savedOrder, items: savedItems });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", CheckLogin, async function (req, res) {
  try {
    const order = await orderModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const isAdmin = isAdmin(req.user.role.name);
    if (!isAdmin && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Access denied" });
    }

    const updates = {};
    if (req.body.addressId) {
      if (!isAdmin && order.status !== "pending") {
        return res.status(400).send({ message: "Address can only be updated while order is pending" });
      }
      updates.addressId = req.body.addressId;
    }

    if (req.body.status) {
      if (!isAdmin && req.body.status !== "cancelled") {
        return res.status(403).send({ message: "Only admin can change order status" });
      }
      updates.status = req.body.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).send({ message: "No valid update fields" });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.send(updatedOrder);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", CheckLogin, async function (req, res) {
  try {
    const order = await orderModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const isAdmin = isAdmin(req.user.role.name);
    if (!isAdmin && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Access denied" });
    }

    order.isDeleted = true;
    await order.save();

    res.send({ message: "Order deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
