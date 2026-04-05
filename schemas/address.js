const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }  
}, { timestamps: true });

module.exports = mongoose.model("address", addressSchema);