const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("author", authorSchema);