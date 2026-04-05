const express = require("express");
const router = express.Router();

// ===== API ROUTES =====

// USER + ROLE + AUTH
router.use("/users", require("./user"));
router.use("/roles", require("./role"));
router.use("/auth", require("./auth"));

// PRODUCT
router.use("/categories", require("./category"));
router.use("/books", require("./book"));
router.use("/authors", require("./author"));

// CART + ORDER
router.use("/carts", require("./cart"));
router.use("/orders", require("./order"));

// PAYMENT + SHIPMENT
router.use("/payments", require("./payment"));
router.use("/shipments", require("./shipment"));

// ADDRESS + INVENTORY
router.use("/addresses", require("./address"));
router.use("/inventories", require("./inventory"));

module.exports = router;