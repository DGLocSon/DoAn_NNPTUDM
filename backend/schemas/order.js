const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  shippingAddress: { type: String, required: true },
  phone: { type: String, required: true },
  customerName: { type: String, required: true },
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
    default: "pending"
  },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("order", orderSchema);