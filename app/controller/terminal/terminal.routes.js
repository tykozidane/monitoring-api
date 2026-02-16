import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import terminalConfig from './get-terminal-config.js';
import updateTerminal from './update-terminal.js';
import getTerminalDetailBySn from './get-terminal-detail.js';
import getSyncTerminalStatus from './get-sync-terminal-status.js';
import releaseTerminal from './release-terminal.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
const router = express.Router();


router.post('/get-terminal-config', basicAuth, terminalConfig);
router.post('/update-terminal', validateTerminal, updateTerminal);
router.get('/get-sync-terminal-status', getSyncTerminalStatus);
router.post('/get-terminal-detail',validateTerminal, getTerminalDetailBySn);
router.post('/release-terminal', basicAuth, releaseTerminal);


export default router;
