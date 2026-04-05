const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "author" },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
  price: { type: Number, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookSchema.virtual('inventory', {
  ref: 'inventory',
  localField: '_id',
  foreignField: 'bookId',
  justOne: true
});

module.exports = mongoose.model("book", bookSchema);