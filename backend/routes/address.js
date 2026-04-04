const express = require("express");
const router = express.Router();
const addressSchema = require("../schemas/address");
let { CheckLogin } = require('../utils/authHandler');

/**
 * [GET] Lấy danh sách địa chỉ của User
 * Sắp xếp: Địa chỉ mặc định lên đầu, sau đó đến mới nhất.
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
 * Logic: Nếu là địa chỉ đầu tiên HOẶC người dùng chọn làm mặc định => Bỏ mặc định các cái cũ.
 */
router.post('/', CheckLogin, async function (req, res) {
    try {
        let user = req.user;
        let { fullName, phone, city, district, street, isDefault } = req.body;

        if (!fullName || !phone || !city || !district || !street) {
            return res.status(400).send({ message: "Vui lòng nhập đầy đủ thông tin địa chỉ" });
        }

        // 1. Kiểm tra xem user đã có địa chỉ nào chưa
        const count = await addressSchema.countDocuments({ userId: user._id, isDeleted: false });

        // 2. Xác định xem địa chỉ này có nên là mặc định không
        // Nếu là cái đầu tiên thì ép buộc là true. Nếu không thì lấy theo ý người dùng.
        let shouldBeDefault = count === 0 ? true : (isDefault || false);

        // 3. FIX: Nếu cái mới này là mặc định, hãy bỏ mặc định tất cả các cái cũ của user này
        if (shouldBeDefault === true) {
            await addressSchema.updateMany(
                { userId: user._id }, 
                { isDefault: false }
            );
        }

        let newAddress = new addressSchema({
            userId: user._id,
            fullName,
            phone,
            city,
            district,
            street,
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
        let { fullName, phone, city, district, street, isDefault } = req.body;

        if (!fullName || !phone || !city || !district || !street) {
            return res.status(400).send({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        let addressToUpdate = await addressSchema.findOne({
            _id: req.params.id,
            userId: user._id,
            isDeleted: false
        });

        if (!addressToUpdate) {
            return res.status(404).send({ message: "Không tìm thấy địa chỉ" });
        }

        // FIX: Tương tự POST, nếu cập nhật cái này thành mặc định, bỏ các cái khác
        if (isDefault === true) {
            await addressSchema.updateMany({ userId: user._id }, { isDefault: false });
        }

        addressToUpdate.fullName = fullName;
        addressToUpdate.phone = phone;
        addressToUpdate.city = city;
        addressToUpdate.district = district;
        addressToUpdate.street = street;
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
            return res.status(404).send({ message: "Address not found" });
        }

        address.isDeleted = true;
        // Nếu xóa đúng cái đang là mặc định, bạn có thể cần logic để set cái khác làm mặc định (tùy ý bạn)
        
        await address.save();
        res.send({ message: "Address deleted successfully" });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;