import express from 'express';
import jwtAuthMiddleware from '../../middleware/jwt-auth.js';
import getThreshold from "./get-threshold.js";
import updateThreshold from "./update-threshold.js";

const router = express.Router();

router.post(
    "/get-threshold",
    jwtAuthMiddleware,
    getThreshold
);
router.put(
    "/update-threshold",
    jwtAuthMiddleware,
    updateThreshold
);


export default router;
