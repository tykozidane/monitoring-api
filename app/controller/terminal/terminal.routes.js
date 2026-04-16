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
import spareGate from './spare-gate.js';
import checkMonitoringTerminal from './check-terminal-monitoring.js';
import rollbackRealeseTerminal from './rollback-release-terminal.js';
import detailTerminalMonitoring from './detail-terminal-monitoring.js';
import { validateTerminal } from '../../middleware/validate-terminal.js';
import { validateSignature } from '../../middleware/validate-signature.js';
import { getTerminal } from '../../service/terminal/terminal-config-service.js';
import jwtAuthMiddleware from '../../middleware/jwt-auth.js';
const router = express.Router();


router.post('/get-terminal-config', jwtAuthMiddleware, terminalConfig);
router.post('/update-terminal',jwtAuthMiddleware, validateTerminal, updateTerminal);
router.get('/get-sync-terminal-status',jwtAuthMiddleware, getSyncTerminalStatus);
router.post('/get-terminal-detail',jwtAuthMiddleware, validateTerminal, getTerminalDetailBySn);
router.post('/release-terminal', jwtAuthMiddleware, releaseTerminal);
router.post('/mapping-terminal', jwtAuthMiddleware, mappingTerminal);
router.post('/get-data-mapping-terminal-sync', jwtAuthMiddleware, getDataMappingTerminalSync);
router.get('/get-free-terminal', jwtAuthMiddleware, getFreeTerminal);
router.post('/add-terminal', jwtAuthMiddleware, addTerminal);
router.get('/type',jwtAuthMiddleware, getTerminalType);
router.get('/spare-gate', jwtAuthMiddleware, spareGate);
router.post('/rollback-release-terminal', jwtAuthMiddleware, rollbackRealeseTerminal);
router.get('/check-monitoring', checkMonitoringTerminal);
router.post('/detail-terminal-monitoring', jwtAuthMiddleware, detailTerminalMonitoring);

export default router;
