import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import getDeviceType from './get-device-type.js';
import getDeviceByTerminalController from './get-device-by-terminal.js';
import createDeviceTypeController from './create-device-type.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
const router = express.Router();

router.post(
    "/device-type",
    getDeviceType
);
router.get(
    "/get-device-by-terminal",
    basicAuth,
    getDeviceByTerminalController
);
router.post(
    "/create-device-type",
    basicAuth,
    createDeviceTypeController
);
export default router;
