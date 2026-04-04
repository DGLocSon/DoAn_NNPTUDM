var express = require("express");
var router = express.Router();

let userController = require('../controllers/users');
let { RegisterValidator, validationResult, ChangPasswordValidator } = require('../utils/validatorHandler');
let { CheckLogin } = require('../utils/authHandler');
let jwt = require('jsonwebtoken');
let bcrypt = require('bcrypt');
// let fs = require('fs'); // ❌ chưa dùng
let crypto = require('crypto');

// let mongoose = require('mongoose'); // ❌ không dùng session nữa
// let cartSchema = require('../schemas/carts'); // ❌ chưa dùng

// ================= REGISTER =================
router.post('/register', RegisterValidator, validationResult, async function (req, res, next) {
    try {
        let newItem = await userController.CreateAnUser(
            req.body.username,
            req.body.password,
            req.body.email,
            "69af870aaa71c433fa8dda8e" // 👉 nhớ là roleId phải tồn tại
        );

        res.send(newItem); // ✅ bắt buộc phải có

    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// ================= LOGIN =================
router.post('/login', async function (req, res, next) {
    try {
        let { username, password } = req.body;

        let result = await userController.FindUserByUsername(username);
        if (!result) {
            return res.status(403).send("sai thong tin dang nhap");
        }

        if (result.lockTime > Date.now()) {
            return res.status(404).send("ban dang bi ban");
        }

        result = await userController.CompareLogin(result, password);
        if (!result) {
            return res.status(403).send("sai thong tin dang nhap");
        }

        let token = jwt.sign(
            { id: result._id },
            'secretKey',
            { expiresIn: '1d' }
        );

        res.cookie("LOGIN_NNPTUD_S3", token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        res.send(token);

    } catch (err) {
        res.status(400).send({ message: err.message });
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