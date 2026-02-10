import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import syncTerminal from './sync-terminal.js';
import terminalConfig from './get-terminal-config.js';
import updateTerminal from './update-terminal.js';
import getSyncTerminalStatus from './get-sync-terminal-status.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
const router = express.Router();

router.post('/sync-terminal', validateSignature, syncTerminal);
router.post('/get-terminal-config', basicAuth, terminalConfig);
router.post('/update-terminal', validateTerminal, updateTerminal);
router.get('/get-sync-terminal-status', getSyncTerminalStatus);

export default router;
