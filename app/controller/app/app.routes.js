import express from 'express';
import { uploadZip } from "../../config/multer.js";
import uploadAppController from "./upload-app.js";
import getAppUpload from "./get-app-update.js";
const router = express.Router();

router.post(
    "/upload",
    uploadZip.single("file"),
    uploadAppController
);

router.get("/download/:filename", async (req, res) => {
    const { filename } = req.params;
    const path = `storage/app/${filename}`;
    res.download(path);
});

router.get("/list-app-update", getAppUpload);

export default router;