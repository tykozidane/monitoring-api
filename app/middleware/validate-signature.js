import crypto from "crypto";

/**
 * Middleware to validate request signature
 */
export const validateSignature = (req, res, next) => {
    try {
        const signature = req.headers["x-signature"];

        if (!signature) {
        return res.status(401).json({
            code: "4010",
            message: "Missing signature or timestamp"
        });
        }

        // 🔐 Client secret (bisa dari DB / ENV)
        const clientSecret = process.env.CLIENT_SECRET;
        if (!clientSecret) {
        return res.status(500).json({
            message: "Client secret not configured"
        });
        }

        // HTTP METHOD (POST, PUT, etc)
        const httpMethod = req.method.toUpperCase();

        // Minify body → JSON tanpa spasi
        const rawBody = req.body && Object.keys(req.body).length
        ? JSON.stringify(req.body)
        : "";
        // console.log("Raw Body:", rawBody);
        const minifiedBody = rawBody.replace(/\s+/g, "");

        // SHA256(body)
        const bodyHash = crypto
        .createHash("sha256")
        .update(minifiedBody)
        .digest("hex")
        .toLowerCase();

        // stringToSign
        const stringToSign =   bodyHash ;

        // Generate signature
        const expectedSignature = crypto
        .createHmac("sha256", clientSecret)
        .update(stringToSign)
        .digest("base64");
        console.log("String to Sign:", stringToSign);
        console.log("Expected Signature:", expectedSignature);
        console.log("Received Signature:", signature);
        // Compare
        if (expectedSignature !== signature) {
        return res.status(401).json({
            code: "4011",
            message: "Invalid signature"
        });
        }

        next();

    } catch (err) {
        return res.status(500).json({
        code: "5000",
        message: "Signature validation error",
        error: err
        });
    }
};
