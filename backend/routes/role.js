var express = require("express");
var router = express.Router();

let { CreateRoleValidator, validationResult } = require('../utils/validatorHandler');
let { CheckLogin, CheckRole } = require('../utils/authHandler');

let roleModel = require("../schemas/roles"); 

/**
 * GET ALL ROLES
 */
router.get("/", CheckLogin, CheckRole(["ADMIN"]), async (req, res) => {
    try {
        let roles = await roleModel.find({ isDeleted: false });

        return res.json({
            success: true,
            data: roles
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


/**
 * GET ROLE BY ID
 */
router.get("/:id", CheckLogin, CheckRole(["ADMIN"]), async (req, res) => {
    try {
        let role = await roleModel.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        return res.json({
            success: true,
            data: role
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Invalid ID"
        });
    }
});


/**
 * CREATE ROLE
 */
router.post("/", CheckLogin, CheckRole(["ADMIN"]), CreateRoleValidator, validationResult, async (req, res) => {
        try {
            // 🔥 tránh trùng name
            let existed = await roleModel.findOne({
                name: req.body.name
            });

            if (existed) {
                return res.status(400).json({
                    success: false,
                    message: "Role already exists"
                });
            }

            let newRole = new roleModel({
                name: req.body.name,
                description: req.body.description || ""
            });

            await newRole.save();

            return res.status(201).json({
                success: true,
                data: newRole
            });

        } catch (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);


/**
 * UPDATE ROLE
 */
router.put("/:id", CheckLogin, CheckRole(["ADMIN"]), async (req, res) => {
    try {

        let updated = await roleModel.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        return res.json({
            success: true,
            data: updated
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
});


/**
 * DELETE ROLE (SOFT DELETE)
 */
router.delete("/:id", CheckLogin, CheckRole(["ADMIN"]), async (req, res) => {
    try {

        let deleted = await roleModel.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        return res.json({
            success: true,
            message: "Deleted successfully"
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;