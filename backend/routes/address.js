const express = require("express");
const router = express.Router();
const addressSchema = require("../schemas/address");
let { CheckLogin } = require('../utils/authHandler')

router.get('/', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let addresses = await addressSchema.find({
        userId: user._id,
        isDeleted: false
    })
    res.send(addresses)
})

router.post('/', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let { name, phone, address } = req.body;    
    if (!name || !phone || !address) {
        return res.status(400).send({
            message: "name, phone and address are required"
        });
    }
    let newAddress = new addressSchema({
        userId: user._id,
        name,
        phone,
        address
    })
    await newAddress.save();
    res.send(newAddress)
})

router.put('/:id', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let { name, phone, address } = req.body;
    if (!name || !phone || !address) {
        return res.status(400).send({
            message: "name, phone and address are required"
        });
    }
    let addressToUpdate = await addressSchema.findOne({
        _id: req.params.id,
        userId: user._id,
        isDeleted: false
    })
    if (!addressToUpdate) {
        return res.status(404).send({
            message: "Address not found"
        });
    }
    addressToUpdate.name = name;
    addressToUpdate.phone = phone;
    addressToUpdate.address = address;
    await addressToUpdate.save();
    res.send(addressToUpdate)
})

router.delete('/:id', CheckLogin, async function (req, res, next) {
    let user = req.user;
    let address = await addressSchema.findOne({
        _id: req.params.id,
        userId: user._id,
        isDeleted: false
    })
    if (!address) {
        return res.status(404).send({
            message: "Address not found"
        });
    }
    address.isDeleted = true;
    await address.save();
    res.send({
        message: "Address deleted successfully"
    })
})

module.exports = router;