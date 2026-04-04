const express = require("express");
const router = express.Router();
const shipmentModel = require("../schemas/shipment");
const orderModel = require("../schemas/order");
const { CheckLogin } = require("../utils/authHandler");

const isAdminOrModerator = (roleName) => ["ADMIN", "MODERATOR"].includes(roleName);

router.get("/", CheckLogin, async function (req, res) {
  try {
    const filter = { isDeleted: false };
    if (!isAdminOrModerator(req.user.role.name)) {
      const orders = await orderModel.find({ userId: req.user._id, isDeleted: false }).select("_id");
      filter.orderId = orders.map((order) => order._id);
    }

    const shipments = await shipmentModel.find(filter).populate("orderId");
    res.send(shipments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

router.get("/:id", CheckLogin, async function (req, res) {
  try {
    const shipment = await shipmentModel.findOne({ _id: req.params.id, isDeleted: false }).populate("orderId");
    if (!shipment) {
      return res.status(404).send({ message: "Shipment not found" });
    }

    if (!isAdminOrModerator(req.user.role.name) && shipment.orderId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Access denied" });
    }

    res.send(shipment);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/", CheckLogin, async function (req, res) {
  try {
    const { orderId, trackingCode } = req.body;
    if (!orderId) {
      return res.status(400).send({ message: "orderId is required" });
    }

    const order = await orderModel.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (order.userId.toString() !== req.user._id.toString() && !isAdminOrModerator(req.user.role.name)) {
      return res.status(403).send({ message: "Access denied" });
    }

    const shipment = new shipmentModel({
      orderId,
      trackingCode: trackingCode || "",
      status: "processing"
    });

    await shipment.save();

    if (order.status === "confirmed") {
      order.status = "shipping";
      await order.save();
    }

    res.status(201).send(shipment);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", CheckLogin, async function (req, res) {
  try {
    const shipment = await shipmentModel.findOne({ _id: req.params.id, isDeleted: false }).populate("orderId");
    if (!shipment) {
      return res.status(404).send({ message: "Shipment not found" });
    }

    if (shipment.orderId.userId.toString() !== req.user._id.toString() && !isAdminOrModerator(req.user.role.name)) {
      return res.status(403).send({ message: "Access denied" });
    }

    const updates = {};
    if (req.body.status) {
      updates.status = req.body.status;
    }
    if (req.body.trackingCode) {
      updates.trackingCode = req.body.trackingCode;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).send({ message: "No valid update fields" });
    }

    const updatedShipment = await shipmentModel.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (updates.status && ["shipping", "delivered", "cancelled"].includes(updates.status)) {
      const orderUpdates = {};
      if (updates.status === "shipping") {
        orderUpdates.status = "shipping";
      }
      if (updates.status === "delivered") {
        orderUpdates.status = "delivered";
      }
      if (updates.status === "cancelled") {
        orderUpdates.status = "cancelled";
      }
      await orderModel.findByIdAndUpdate(shipment.orderId._id, orderUpdates);
    }

    res.send(updatedShipment);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", CheckLogin, async function (req, res) {
  try {
    const shipment = await shipmentModel.findOne({ _id: req.params.id, isDeleted: false }).populate("orderId");
    if (!shipment) {
      return res.status(404).send({ message: "Shipment not found" });
    }

    if (shipment.orderId.userId.toString() !== req.user._id.toString() && !isAdminOrModerator(req.user.role.name)) {
      return res.status(403).send({ message: "Access denied" });
    }

    shipment.isDeleted = true;
    await shipment.save();

    res.send({ message: "Shipment deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
