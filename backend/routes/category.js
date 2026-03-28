const express = require('express');
let router = express.Router();
// let slugify = require('slugify');
let categorySchema = require('../schemas/category');
let bookSchema = require('../schemas/book');


router.get('/', async (req, res) => {
    try {
        let queries = req.query;
        let nameQ = queries.name ? queries.name : '';
        
        let dataCategories = await categorySchema.find({
            isDeleted: false,
            name: new RegExp(nameQ, 'i')
        });
        
        res.send(dataCategories);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        let category = await categorySchema.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!category) {
            return res.status(404).send({ message: "Category không tồn tại hoặc đã bị xóa" });
        }
        res.send(category);
    } catch (error) {
        res.status(400).send({ message: "ID không hợp lệ" });
    }
});


router.get('/:id/books', async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        const category = await categorySchema.exists({ _id: categoryId, isDeleted: false });
        if (!category) {
            return res.status(404).send({ message: "Category không hợp lệ" });
        }

        const books = await bookSchema.find({ 
            categoryId: categoryId, 
            isDeleted: false 
        });
        
        res.send(books);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


router.post('/', async function (req, res) {
    try {
        let { name, description } = req.body;
        
        

        let newItem = new categorySchema({
            name: name,
            description: description || ""

        });

        await newItem.save();
        res.status(201).send(newItem);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});


router.put('/:id', async function (req, res) {
    try {

        let updateData = req.body;
        
        let item = await categorySchema.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false }, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!item) return res.status(404).send({ message: "ID không tồn tại" });
        res.send(item);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});


router.delete('/:id', async function (req, res) {
    try {
        let item = await categorySchema.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!item) return res.status(404).send({ message: "ID không tồn tại hoặc đã xóa rồi" });
        res.send({ message: "Xóa thành công", data: item });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;