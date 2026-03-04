import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const jwtAuthMiddleware = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                status: "401",
                message: "Authorization header missing"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: "401",
                message: "Token not provided"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // cek username
        if (!decoded.username) {
            return res.status(401).json({
                status: "401",
                message: "Invalid token payload (username missing)"
            });
        }

        // cek expired manual (optional karena verify sudah cek exp)
        const now = Math.floor(Date.now() / 1000);

        if (decoded.exp && decoded.exp < now) {
            return res.status(401).json({
                status: "401",
                message: "Token expired"
            });
        }

        // simpan user ke request
        req.user = {
            username: decoded.username
        };

        next();

    } catch (err) {

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                status: "401",
                message: "Token expired"
            });
        }

        return res.status(401).json({
            status: "401",
            message: "Invalid token"
        });
    }
};

export default jwtAuthMiddleware;