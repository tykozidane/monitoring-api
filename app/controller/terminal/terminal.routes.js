import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import syncTerminal from './sync-terminal.js';
const router = express.Router();

router.post('/sync-terminal', basicAuth, syncTerminal);

export default router;
