var express = require("express");
var router = express.Router();

let { CreateUserValidator, validationResult } = require('../utils/validatorHandler');
let userModel = require("../schemas/users");
let userController = require('../controllers/users');
let { CheckLogin, CheckRole } = require('../utils/authHandler');




let roleModel = require("../schemas/roles");





router.get("/", CheckLogin, CheckRole("admin", "ADMIN", "MODERATOR"), async function (req, res) {
  let users = await userModel
    .find({ isDeleted: false })
    .populate('role', 'name');
  res.json({
    success: true,
    data: users
  });
});



router.get("/:id", CheckLogin, async function (req, res) {
  try {
    let result = await userModel.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('role', 'name');

    if (result) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(404).json({ success: false, message: "id not found" });
    }
  } catch (error) {
    res.status(404).json({ success: false, message: "id not found" });
  }
});



router.put("/:id", CheckLogin, CheckRole("admin", "ADMIN"), async function (req, res) {
  try {
    const userId = req.params.id;
    const targetUser = await userModel.findById(userId).populate('role');

    // 🔥 Ngăn chặn khóa tài khoản ADMIN
    if (targetUser && (targetUser.role?.name?.toUpperCase() === 'ADMIN') && req.body.status === false) {
        return res.status(400).json({ 
            success: false, 
            message: "Không thể khóa tài khoản có quyền Admin!" 
        });
    }

    let updatedItem = await userModel.findByIdAndUpdate(
      userId,
      req.body,
      { returnDocument: 'after' }
    );

    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }

    res.json({
        success: true,
        data: updatedItem
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});


router.delete("/:id", async function (req, res) {
  try {
    let updatedItem = await userModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { returnDocument: 'after' }
    );

    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }

    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;