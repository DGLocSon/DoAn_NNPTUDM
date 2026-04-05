let express = require("express");
let router = express.Router();
let paymentModel = require("../schemas/payment");
let orderModel = require("../schemas/order");
let { CheckLogin } = require("../utils/authHandler");

let isAdminOrModerator = (roleName) => ["admin"].includes(roleName);

router.get("/", CheckLogin, async function (req, res) {
  try {
    let filter = { isDeleted: false };
    if (!isAdminOrModerator(req.user.role.name)) {
      let orders = await orderModel.find({ userId: req.user._id, isDeleted: false }).select("_id");
      filter.orderId = orders.map((order) => order._id);
    }

    let payments = await paymentModel.find(filter).populate("orderId");
    res.send(payments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("/:id", CheckLogin, async function (req, res) {
  try {
    let payment = await paymentModel.findOne({ _id: req.params.id, isDeleted: false }).populate("orderId");
    if (!payment) {
      return res.status(404).send({ message: "Payment not found" });
    }

    if (!isAdminOrModerator(req.user.role.name) && payment.orderId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Access denied" });
    }

    res.send(payment);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/", CheckLogin, async function (req, res) {
  try {
    let { orderId, method, transactionId } = req.body;
    if (!orderId || !method) {
      return res.status(400).send({ message: "orderId and method are required" });
    }

    let order = await orderModel.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (order.userId.toString() !== req.user._id.toString() && !isAdminOrModerator(req.user.role.name)) {
      return res.status(403).send({ message: "Access denied" });
    }

    let payment = new paymentModel({
      orderId,
      method,
      transactionId: transactionId || "",
      status: method === "COD" ? "pending" : "pending"
    });

    await payment.save();
    res.status(201).send(payment);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", CheckLogin, async function (req, res) {
  try {
    let payment = await paymentModel.findOne({ _id: req.params.id, isDeleted: false }).populate("orderId");
    if (!payment) {
      return res.status(404).send({ message: "Payment not found" });
    }

    if (payment.orderId.userId.toString() !== req.user._id.toString() && !isAdminOrModerator(req.user.role.name)) {
      return res.status(403).send({ message: "Access denied" });
    }

    let updates = {};
    if (req.body.method) {
      updates.method = req.body.method;
    }
    if (req.body.transactionId) {
      updates.transactionId = req.body.transactionId;
    }
    if (req.body.status) {
      updates.status = req.body.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).send({ message: "No valid update fields" });
    }

    let updatedPayment = await paymentModel.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (updates.status === "success") {
      await orderModel.findByIdAndUpdate(payment.orderId._id, { status: "confirmed" });
    }

    res.send(updatedPayment);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", CheckLogin, async function (req, res) {
  try {
    let payment = await paymentModel.findOne({ _id: req.params.id, isDeleted: false }).populate("orderId");
    if (!payment) {
      return res.status(404).send({ message: "Payment not found" });
    }

    if (payment.orderId.userId.toString() !== req.user._id.toString() && !isAdminOrModerator(req.user.role.name)) {
      return res.status(403).send({ message: "Access denied" });
    }

    payment.isDeleted = true;
    await payment.save();

    res.send({ message: "Payment deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
