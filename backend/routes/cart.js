const express = require('express');
let router = express.Router();

let cartSchema = require('../schemas/cart');
let cartItemSchema = require('../schemas/cart-item');
let inventorySchema = require('../schemas/inventory');

let { CheckLogin } = require('../utils/authHandler');

/**
 * GET CART
 */
router.get('/', CheckLogin, async (req, res) => {
    try {
        let cart = await cartSchema.findOne({
            userId: req.user._id,
            isDeleted: false
        });

        if (!cart) {
            cart = await cartSchema.create({ userId: req.user._id });
        }

        let items = await cartItemSchema.find({
            cartId: cart._id,
            isDeleted: false
        }).populate({
            path: 'bookId',
            populate: [
                { path: 'authorId', select: 'name' },
                { path: 'inventory', select: 'stock' }
            ]
        });

        return res.json({
            success: true,
            data: items
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * ADD TO CART
 */
router.post('/add', CheckLogin, async (req, res) => {
    try {
        let { bookId, quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be > 0"
            });
        }

        // 🔥 check inventory
        let inventory = await inventorySchema.findOne({ bookId });
        
        if (!inventory) {
            // Create inventory with 0 stock if missing
            inventory = await inventorySchema.create({
                bookId,
                stock: 0
            });
        }

        if (inventory.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Sản phẩm đã hết hàng hoặc không đủ số lượng"
            });
        }

        let cart = await cartSchema.findOne({
            userId: req.user._id,
            isDeleted: false
        });

        if (!cart) {
            cart = await cartSchema.create({ userId: req.user._id });
        }

        let item = await cartItemSchema.findOne({
            cartId: cart._id,
            bookId,
            isDeleted: false
        });

        if (item) {
            item.quantity += quantity;
            await item.save();
        } else {
            item = await cartItemSchema.create({
                cartId: cart._id,
                bookId,
                quantity
            });
        }

        return res.json({
            success: true,
            message: "Added to cart",
            data: item
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * UPDATE CART ITEM
 */
router.put('/update/:id', CheckLogin, async (req, res) => {
    try {
        let { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be > 0"
            });
        }

        let item = await cartItemSchema.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        // 🔥 check owner
        let cart = await cartSchema.findById(item.cartId);
        if (cart.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Forbidden"
            });
        }

        item.quantity = quantity;
        await item.save();

        return res.json({
            success: true,
            message: "Updated",
            data: item
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * REMOVE ITEM (soft delete)
 */
router.delete('/remove/:id', CheckLogin, async (req, res) => {
    try {
        let item = await cartItemSchema.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        // 🔥 check owner
        let cart = await cartSchema.findById(item.cartId);
        if (cart.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Forbidden"
            });
        }

        item.isDeleted = true;
        await item.save();

        return res.json({
            success: true,
            message: "Removed from cart"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;