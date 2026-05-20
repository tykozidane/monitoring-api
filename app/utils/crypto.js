import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const SECRET = process.env.CRYPTO_SECRET_KEY;

const KEY = crypto
    .createHash("sha256")
    .update(SECRET)
    .digest();

export const encrypt = (text) => {

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        KEY,
        iv
    );

    let encrypted = cipher.update(
        text,
        "utf8",
        "hex"
    );

    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return [
        iv.toString("hex"),
        tag.toString("hex"),
        encrypted
    ].join(":");
};

export const decrypt = (encryptedText) => {

    const [
        ivHex,
        tagHex,
        encrypted
    ] = encryptedText.split(":");

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        KEY,
        Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(
        Buffer.from(tagHex, "hex")
    );

    let decrypted = decipher.update(
        encrypted,
        "hex",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return decrypted;
};