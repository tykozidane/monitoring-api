import express from 'express';
import basicAuth from '../../middleware/basic-auth.js';
import terminalConfig from './get-terminal-config.js';
import updateTerminal from './update-terminal.js';
import getTerminalDetailBySn from './get-terminal-detail.js';
import getSyncTerminalStatus from './get-sync-terminal-status.js';
import releaseTerminal from './release-terminal.js';
import mappingTerminal from './mapping-terminal.js';
import getDataMappingTerminalSync from './get-data-mapping-terminal-sync.js';
import getFreeTerminal from './get-free-terminal.js';
import getTerminalType from './get-terminal-type.js';
import addTerminal from './add-terminal.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
import { getTerminal } from '../../service/terminal/terminal-config-service.js';
const router = express.Router();


router.post('/get-terminal-config', basicAuth, terminalConfig);
router.post('/update-terminal', validateTerminal, updateTerminal);
router.get('/get-sync-terminal-status', getSyncTerminalStatus);
router.post('/get-terminal-detail',validateTerminal, getTerminalDetailBySn);
router.post('/release-terminal', basicAuth, releaseTerminal);
router.post('/mapping-terminal', basicAuth, mappingTerminal);
router.post('/get-data-mapping-terminal-sync', basicAuth, getDataMappingTerminalSync);
router.get('/get-free-terminal', basicAuth, getFreeTerminal);
router.post('/add-terminal', basicAuth, addTerminal);
router.get('/type',basicAuth, getTerminalType);


export default router;
