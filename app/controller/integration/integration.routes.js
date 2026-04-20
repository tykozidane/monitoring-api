import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
import syncTerminal from './sync-terminal.js';
import deviceTelemetricsController from './device-telemetrics.js';
import getSummaryTelemetricsController from './summary-telemetrics.js';

const router = express.Router();

router.post('/terminal/sync-terminal',basicAuth, validateSignature, syncTerminal);
router.get(
    "/device/telemetrics",
    deviceTelemetricsController
);
router.post(
    "/station/summary-telemetrics",
    basicAuth,
    getSummaryTelemetricsController
);
export default router;
