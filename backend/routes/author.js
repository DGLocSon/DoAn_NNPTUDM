const express = require("express");
const router = express.Router();
const authorSchema = require("../schemas/author");
const bookSchema = require("../schemas/book");
let mongoose = require('mongoose')

// GET ALL (có search)
router.get("/", async (req, res) => {
  try {
    let nameQ = req.query.name ? req.query.name : "";

    const authors = await authorSchema.find({
      isDeleted: false,
      name: new RegExp(nameQ, "i")
    });

    res.send(authors);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


// GET BY ID
router.get("/:id", async (req, res) => {
  try {
    const author = await authorSchema.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!author) {
      return res.status(404).send({ message: "Author không tồn tại" });
    }

    res.send(author);
  } catch (error) {
    res.status(400).send({ message: "ID không hợp lệ" });
  }
});


// GET BOOKS BY AUTHOR
router.get("/:id/books", async (req, res) => {
  try {
    const authorId = req.params.id;

    const author = await authorSchema.exists({
      _id: authorId,
      isDeleted: false
    });

    if (!author) {
      return res.status(404).send({ message: "Author không hợp lệ" });
    }

    const books = await bookSchema.find({
      authorId: authorId,   // 🔥 đúng field
      isDeleted: false
    });

    res.send(books);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


// CREATE
router.post("/", async (req, res) => {
  try {
    const { name, bio } = req.body;

    const newAuthor = new authorSchema({
      name,
      bio: bio || ""
    });

    await newAuthor.save();

    res.status(201).send(newAuthor);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});


// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await authorSchema.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send({ message: "Author không tồn tại" });
    }

    res.send(updated);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});


// DELETE (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await authorSchema.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).send({ message: "Author không tồn tại hoặc đã xóa" });
    }

    res.send({ message: "Xóa thành công", data: deleted });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;