var express = require("express");
var router = express.Router();
let userSchema = require('../schemas/users');
let userController = require('../controllers/users');
let { RegisterValidator, validationResult, ChangPasswordValidator } = require('../utils/validatorHandler');
let { CheckLogin } = require('../utils/authHandler');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcrypt');
// let fs = require('fs'); 
let crypto = require('crypto');
// let mongoose = require('mongoose'); // 
// let cartSchema = require('../schemas/carts'); // 

// ================= REGISTER =================
let roleSchema = require('../schemas/roles');

router.post('/register', RegisterValidator, validationResult, async (req, res) => {
    try {

        let roleId = req.body.roleId;

        if (!roleId) {
            let userRole = await roleSchema.findOne({
                name: "user",
                isDeleted: false
            });

            if (!userRole) {
                return res.status(500).json({
                    success: false,
                    message: "Role USER chưa tồn tại"
                });
            }

            roleId = userRole._id;
        }

        let newUser = await userController.CreateAnUser(
            req.body.username,
            req.body.password,
            req.body.email,
            roleId,
            null, // session
            req.body.username, // fullName mặc định
            undefined, // avatarUrl
            true // status
        );

        return res.status(201).json({
            success: true,
            data: newUser
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

// ================= LOGIN =================
router.post('/login', async function (req, res) {
    try {
        let { email, password } = req.body;

        // 1. Tìm user bằng EMAIL (thay vì username)
        let result = await userSchema.findOne({ email, isDeleted: false }).populate('role');

        if (!result) return res.status(403).json({ success: false, message: "Sai thông tin đăng nhập" });

        // 🔥 2. Kiểm tra nếu user bị chặn (status: false)
        if (!result.status) {
            return res.status(403).json({ 
                success: false, 
                message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." 
            });
        }

        // 3. Kiểm tra mật khẩu
        const isMatch = bcrypt.compareSync(password, result.password);
        if (!isMatch) return res.status(403).json({ success: false, message: "Sai thông tin đăng nhập" });

        // 3. Tạo JWT
        let token = jwt.sign(
            { 
                id: result._id, 
                role: result.role?.name || 'user'
            },
            process.env.JWT_SECRET || 'secretKey',
            { expiresIn: '1d' }
        );

        // 4. Trả về cho Frontend
        res.status(200).json({
            success: true,
            token: token,
            user: {
                id: result._id,
                username: result.username,
                email: result.email,
                roleName: result.role?.name || 'user'
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// ================= ME =================
router.get('/me', CheckLogin, function (req, res, next) {
    res.send(req.user);
});

// ================= LOGOUT =================
router.post('/logout', CheckLogin, function (req, res, next) {
    res.cookie("LOGIN_NNPTUD_S3", "", {
        maxAge: 0,
        httpOnly: true
    });
    res.send("da logout");
});

// ================= CHANGE PASSWORD =================
router.post(
    '/changepassword',
    CheckLogin,
    ChangPasswordValidator,
    validationResult,
    async function (req, res, next) {

        let { newpassword, oldpassword } = req.body;
        let user = req.user;

        if (bcrypt.compareSync(oldpassword, user.password)) {
            user.password = newpassword;
            await user.save();
            res.send("doi pass thanh cong");
        } else {
            res.status(404).send("old password khong dung");
        }
    }
);

// ================= FORGOT PASSWORD =================
router.post('/forgotpassword', async function (req, res, next) {
    let { email } = req.body;
    let user = await userController.FindUserByEmail(email);

    if (user) {
        user.forgotPasswordToken = crypto.randomBytes(32).toString('hex');
        user.forgotPasswordTokenExp = Date.now() + 10 * 60 * 1000;

        let url = "http://localhost:3000/api/v1/auth/resetpassword/" + user.forgotPasswordToken;

        await user.save();

        // ❌ sendMail chưa định nghĩa → comment lại
        // await sendMail(user.email, url)
    }

    res.send("check email");
});

// ================= RESET PASSWORD =================
router.post('/resetpassword/:token', async function (req, res, next) {
    let { password } = req.body;
    let user = await userController.FindUserByToken(req.params.token);

    if (user) {
        user.password = password;
        user.forgotPasswordToken = null;
        user.forgotPasswordTokenExp = null;

        await user.save();
        res.send("da cap nhat");
    } else {
        res.status(404).send("token loi");
    }
});

module.exports = router;