const express = require("express");
const router = express.Router();
const addressSchema = require("../schemas/address");
let { CheckLogin } = require('../utils/authHandler');

/**
 * [GET] Lấy danh sách địa chỉ của User
 */
router.get('/', CheckLogin, async function (req, res) {
    try {
        let addresses = await addressSchema.find({
            userId: req.user._id,
            isDeleted: false
        }).sort({ isDefault: -1, createdAt: -1 });
        
        res.send(addresses);
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

/**
 * [POST] Thêm địa chỉ mới
 */
router.post('/', CheckLogin, async function (req, res) {
    try {
        let user = req.user;
        let { fullName, phone, address, isDefault } = req.body;

        // Kiểm tra đầu vào tối giản
        if (!fullName || !phone || !address) {
            return res.status(400).send({ message: "Vui lòng nhập đầy đủ: Tên, SĐT và Địa chỉ" });
        }

        const count = await addressSchema.countDocuments({ userId: user._id, isDeleted: false });
        let shouldBeDefault = count === 0 ? true : (isDefault || false);

        if (shouldBeDefault === true) {
            await addressSchema.updateMany({ userId: user._id }, { isDefault: false });
        }

        let newAddress = new addressSchema({
            userId: user._id,
            fullName,
            phone,
            address, // Gán trực tiếp chuỗi địa chỉ
            isDefault: shouldBeDefault
        });

        await newAddress.save();
        res.status(201).send(newAddress);
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

/**
 * [PUT] Cập nhật địa chỉ
 */
router.put('/:id', CheckLogin, async function (req, res) {
    try {
        let user = req.user;
        let { fullName, phone, address, isDefault } = req.body;

        if (!fullName || !phone || !address) {
            return res.status(400).send({ message: "Vui lòng không để trống thông tin" });
        }

        let addressToUpdate = await addressSchema.findOne({
            _id: req.params.id,
            userId: user._id,
            isDeleted: false
        });

        if (!addressToUpdate) {
            return res.status(404).send({ message: "Không tìm thấy địa chỉ" });
        }

        if (isDefault === true) {
            await addressSchema.updateMany({ userId: user._id }, { isDefault: false });
        }

        addressToUpdate.fullName = fullName;
        addressToUpdate.phone = phone;
        addressToUpdate.address = address; // Cập nhật địa chỉ mới
        addressToUpdate.isDefault = isDefault !== undefined ? isDefault : addressToUpdate.isDefault;

        await addressToUpdate.save();
        res.send(addressToUpdate);
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

/**
 * [DELETE] Xóa địa chỉ (Soft Delete)
 */
router.delete('/:id', CheckLogin, async function (req, res) {
    try {
        let address = await addressSchema.findOne({
            _id: req.params.id,
            userId: req.user._id,
            isDeleted: false
        });

        if (!address) {
            return res.status(404).send({ message: "Địa chỉ không tồn tại" });
        }

        address.isDeleted = true;
        await address.save();
        res.send({ message: "Xóa địa chỉ thành công" });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;