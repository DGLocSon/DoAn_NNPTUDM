const express = require('express')
let router = express.Router()
let slugify = require('slugify')
let bookSchema = require('../schemas/book')
let inventorySchema = require('../schemas/inventory')
let mongoose = require('mongoose')

let { CheckLogin, CheckRole } = require('../utils/authHandler')

/**
 * GET ALL BOOKS
 */
router.get('/', async (req, res) => {
    try {
        let minQ = req.query.min ? Number(req.query.min) : 0;

        let filter = {
            isDeleted: false,
            price: { $gte: minQ }
        };

        if (req.query.categoryId && mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
            filter.categoryId = req.query.categoryId;
        }

        let query = bookSchema.find(filter)
            .populate('categoryId', 'name')
            .populate('authorId', 'name');

        if (req.query.limit) {
            let lim = parseInt(req.query.limit, 10);
            if (!Number.isNaN(lim) && lim > 0) {
                query = query.limit(Math.min(lim, 200));
            }
        }

        let result = await query;

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
})

/**
 * GET BOOK BY ID
 */
router.get('/:id', async (req, res) => {
    try {
        let result = await bookSchema.findOne({
            isDeleted: false,
            _id: req.params.id
        })
        .populate('categoryId', 'name')
        .populate('authorId', 'name');

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid ID"
        });
    }
})

/**
 * CREATE BOOK (ADMIN ONLY)
 */
router.post('/', CheckLogin, CheckRole(['admin']), async (req, res) => {
    let session = await mongoose.startSession();
    session.startTransaction();

    try {
        let newBook = new bookSchema({
            title: req.body.title,
            slug: slugify(req.body.title || '', { lower: true }),
            description: req.body.description,
            categoryId: req.body.categoryId,
            image: req.body.image,
            price: req.body.price
        });

        let savedBook = await newBook.save({ session });

        let newInventory = new inventorySchema({
            bookId: savedBook._id,
            stock: 0
        });

        await newInventory.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            data: savedBook
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
})

/**
 * UPDATE BOOK (ADMIN ONLY)
 */
router.put('/:id', CheckLogin, CheckRole(['admin']), async (req, res) => {
    try {
        let book = await bookSchema.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        // 🔥 chỉ cho update field an toàn
        const allowedFields = ['title', 'description', 'price', 'categoryId', 'image'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                book[field] = req.body[field];
            }
        });

        // update slug nếu đổi title
        if (req.body.title) {
            book.slug = slugify(req.body.title, { lower: true });
        }

        await book.save();

        return res.json({
            success: true,
            data: book
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
})

/**
 * DELETE BOOK (ADMIN ONLY)
 */
router.delete('/:id', CheckLogin, CheckRole(['admin']), async (req, res) => {
    try {
        let book = await bookSchema.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        book.isDeleted = true;
        await book.save();

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
})

module.exports = router;