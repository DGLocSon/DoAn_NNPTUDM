var express = require("express");
var router = express.Router();

let { CreateUserValidator, validationResult } = require('../utils/validatorHandler');
let userModel = require("../schemas/users");
let userController = require('../controllers/users');
let { CheckLogin, CheckRole } = require('../utils/authHandler');




let roleModel = require("../schemas/roles");




// ================= GET ALL =================
router.get("/", CheckLogin, CheckRole("ADMIN", "MODERATOR"), async function (req, res) {
  let users = await userModel
    .find({ isDeleted: false })
    .populate({
      path: 'role',
      select: 'name'
    });
  res.send(users);
});


// ================= GET BY ID =================
router.get("/:id", CheckLogin, CheckRole("ADMIN"), async function (req, res) {
  try {
    let result = await userModel.find({
      _id: req.params.id,
      isDeleted: false
    });

    if (result.length > 0) {
      res.send(result);
    } else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

// ================= UPDATE =================
router.put("/:id", async function (req, res) {
  try {
    let updatedItem = await userModel.findByIdAndUpdate(
      req.params.id,
      req.body,
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

// ================= DELETE =================
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