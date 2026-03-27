const orderDetailSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "book" },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("orderDetail", orderDetailSchema);