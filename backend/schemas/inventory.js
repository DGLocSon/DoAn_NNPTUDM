const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "book",
    required: true,
    unique: true
  },
  stock: {
    type: Number,
    min: 0,
    default: 0
  },
  reserved: {
    type: Number,
    min: 0,
    default: 0
  },
  soldCount: {
    type: Number,
    min: 0,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("inventory", inventorySchema);