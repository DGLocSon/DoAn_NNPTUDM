const express = require('express');
let router = express.Router();

let categorySchema = require('../schemas/category');
let bookSchema = require('../schemas/book');

let { CheckLogin, CheckRole } = require('../utils/authHandler');

/**
 * GET ALL CATEGORY (search)
 */
router.get('/', async (req, res) => {
    try {
        let nameQ = req.query.name || '';

        let data = await categorySchema.find({
            isDeleted: false,
            name: new RegExp(nameQ, 'i')
        });

        return res.json({
            success: true,
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * GET CATEGORY BY ID
 */
router.get('/:id', async (req, res) => {
    try {
        let category = await categorySchema.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.json({
            success: true,
            data: category
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid ID"
        });
    }
});


/**
 * GET BOOKS BY CATEGORY
 */
router.get('/:id/books', async (req, res) => {
    try {
        const categoryId = req.params.id;

        const category = await categorySchema.exists({
            _id: categoryId,
            isDeleted: false
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const books = await bookSchema.find({
            categoryId: categoryId,
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
 * CREATE CATEGORY (ADMIN ONLY)
 */
router.post('/', CheckLogin, CheckRole(['admin']), async (req, res) => {
    try {
        let { name, description } = req.body;

        let newItem = new categorySchema({
            name,
            description: description || ""
        });

        await newItem.save();

        return res.status(201).json({
            success: true,
            data: newItem
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * UPDATE CATEGORY (ADMIN ONLY)
 */
router.put('/:id', CheckLogin, CheckRole(['admin']), async (req, res) => {
    try {
        let category = await categorySchema.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // 🔥 chỉ update field an toàn
        const allowedFields = ['name', 'description'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                category[field] = req.body[field];
            }
        });

        await category.save();

        return res.json({
            success: true,
            data: category
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * DELETE CATEGORY (ADMIN ONLY - soft delete)
 */
router.delete('/:id', CheckLogin, CheckRole(['admin']), async (req, res) => {
    try {
        let category = await categorySchema.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.isDeleted = true;
        await category.save();

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