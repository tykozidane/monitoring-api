import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
import { validateProject } from '../../middleware/validate-project.js';
import getStationMiniController from "./get-station-mini.js";

const router = express.Router();

router.get(
    "/mini",
    basicAuth,
    getStationMiniController
);


export default router;
