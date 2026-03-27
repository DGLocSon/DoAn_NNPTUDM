const shipmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
  status: {
    type: String,
    enum: ["processing", "shipping", "delivered", "cancelled"],
    default: "processing"
  },
  trackingCode: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("shipment", shipmentSchema);