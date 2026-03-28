const express = require("express");
const router = express.Router();
const inventorySchema = require("../schemas/inventory");

// GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await inventorySchema.find({ isDeleted: false })
      .populate("bookId");

    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET BY BOOK ID
router.get("/book/:bookId", async (req, res) => {
  try {
    const item = await inventorySchema.findOne({
      bookId: req.params.bookId,
      isDeleted: false
    });

    if (!item) {
      return res.status(404).send({ message: "Not found" });
    }

    res.send(item);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// UPDATE STOCK
router.put("/:id", async (req, res) => {
  try {
    const item = await inventorySchema.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.send(item);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// DELETE (soft)
router.delete("/:id", async (req, res) => {
  try {
    const item = await inventorySchema.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    res.send({ message: "Deleted", data: item });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;