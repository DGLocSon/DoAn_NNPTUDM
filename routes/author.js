const express = require("express");
const router = express.Router();
const authorSchema = require("../schemas/author");
const bookSchema = require("../schemas/book");

let { CheckLogin, CheckRole } = require('../utils/authHandler');

/**
 * GET ALL AUTHORS (search)
 */
router.get("/", async (req, res) => {
  try {
    let nameQ = req.query.name || "";

    const authors = await authorSchema.find({
      isDeleted: false,
      name: new RegExp(nameQ, "i")
    });

    return res.json({
      success: true,
      data: authors
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


/**
 * GET AUTHOR BY ID
 */
router.get("/:id", async (req, res) => {
  try {
    const author = await authorSchema.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found"
      });
    }

    return res.json({
      success: true,
      data: author
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID"
    });
  }
});


/**
 * GET BOOKS BY AUTHOR
 */
router.get("/:id/books", async (req, res) => {
  try {
    const authorId = req.params.id;

    const author = await authorSchema.exists({
      _id: authorId,
      isDeleted: false
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found"
      });
    }

    const books = await bookSchema.find({
      authorId: authorId,
      isDeleted: false
    }).populate('categoryId', 'name');

    return res.json({
      success: true,
      data: books
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


/**
 * CREATE AUTHOR (ADMIN ONLY)
 */
router.post("/", CheckLogin, CheckRole(['admin']), async (req, res) => {
  try {
    const { name, bio } = req.body;

    const newAuthor = new authorSchema({
      name,
      bio: bio || ""
    });

    await newAuthor.save();

    return res.status(201).json({
      success: true,
      data: newAuthor
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


/**
 * UPDATE AUTHOR (ADMIN ONLY)
 */
router.put("/:id", CheckLogin, CheckRole(['admin']), async (req, res) => {
  try {

    const author = await authorSchema.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found"
      });
    }

    // 🔥 chỉ cho update field an toàn
    const allowedFields = ['name', 'bio'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        author[field] = req.body[field];
      }
    });

    await author.save();

    return res.json({
      success: true,
      data: author
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


/**
 * DELETE AUTHOR (ADMIN ONLY - soft delete)
 */
router.delete("/:id", CheckLogin, CheckRole(['admin']), async (req, res) => {
  try {
    const author = await authorSchema.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found"
      });
    }

    author.isDeleted = true;
    await author.save();

    return res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;