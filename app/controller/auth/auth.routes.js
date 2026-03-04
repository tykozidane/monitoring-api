import express from 'express';
import generateToken from "./generate-token.js";
import basicAuth from '../../middleware/basic-auth.js';
const router = express.Router();

router.get(
    "/generate-token",
    basicAuth,
    generateToken
);


export default router;