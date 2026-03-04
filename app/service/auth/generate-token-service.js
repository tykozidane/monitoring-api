import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export const generateTokenService = async (username) => {
    try {

        const payload = {
            username
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        return {
            code: 0,
            message: {
                token,
                expires_in: "8h"
            }
        };

    } catch (err) {
        return {
            code: "8000",
            message: "Failed to generate token",
            data: err
        };
    }
};