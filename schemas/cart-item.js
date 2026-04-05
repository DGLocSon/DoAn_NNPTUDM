const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: "cart" },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "book" },
  quantity: { type: Number, default: 1 },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("cartItem", cartItemSchema);