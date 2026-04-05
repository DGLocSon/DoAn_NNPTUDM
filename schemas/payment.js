const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
  method: {
    type: String,
    enum: ["COD", "MOMO", "VNPAY"],
    default: "COD"
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  },
  transactionId: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("payment", paymentSchema);