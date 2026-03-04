import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "storage/app/");
    },
    filename: function (req, file, cb) {

        const ext = path.extname(file.originalname);

        // ambil nama tanpa extension
        const baseName = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .replace(/\s+/g, "_"); // ganti spasi jadi underscore

        const timestamp = Date.now();

        const finalName = `${baseName}_${timestamp}${ext}`;

        cb(null, finalName);
    }
});

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".zip") {
        return cb(new Error("Only .zip files are allowed"));
    }
    cb(null, true);
};

export const uploadZip = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});