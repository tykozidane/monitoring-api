import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import syncTerminal from './sync-terminal.js';
import terminalConfig from './get-terminal-config.js';
const router = express.Router();

router.post('/sync-terminal', basicAuth, syncTerminal);
router.post('/get-terminal-config', basicAuth, terminalConfig);

export default router;
