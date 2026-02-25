import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
import { validateProject } from '../../middleware/validate-project.js';
import getAllProject from './get-all-project.js';
const router = express.Router();

router.get('/get-all-project', basicAuth, getAllProject);


export default router;
