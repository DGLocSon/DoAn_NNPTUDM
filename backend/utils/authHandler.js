let userController = require('../controllers/users')
let jwt = require('jsonwebtoken')

module.exports = {

    // ===== CHECK LOGIN =====
    CheckLogin: async function (req, res, next) {
        let token = req.headers.authorization;

        // Nếu có header Authorization và bắt đầu bằng "Bearer "
        if (token && token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }

        // lấy từ cookie nếu không có header
        if (!token) {
            token = req.cookies.LOGIN_NNPTUD_S3;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập"
            });
        }

        try {
            let decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');

            let user = await userController.GetUserById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User không tồn tại"
                });
            }

            // 🔥 QUAN TRỌNG: populate role
            await user.populate('role');

            req.user = user;
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }
    },

    // ===== CHECK ROLE =====
    CheckRole: function (requiredRoles) {
        return function (req, res, next) {

            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            let currentRole = req.user.role.name;

            if (requiredRoles.includes(currentRole)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền"
            });
        }
    }

}