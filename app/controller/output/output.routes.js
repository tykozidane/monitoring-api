import express from 'express';

import send_all_data from './send-all-data.js'
import deviceByProject from './device-by-project.js'
import detailDevice from './detail-device-by-c-device.js'
import sendAllStation from './send-all-station.js'
import deviceByStation from './device-by-station.js'
import basicAuth from '../../middleware/basic-auth.js';
import getAllTerminalLatestMonitoringController from '../output/getAllTerminalLatestMonitoringController.js';
import terminalByStation from './terminal-by-station.js';
import monitoringSummary from './monitoring-summary.js';
const router = express.Router();

router.post('/all-data', send_all_data);
router.post('/device-by-project', deviceByProject);
router.post('/detail-device', detailDevice);
router.post('/all-station', sendAllStation);
router.post('/device-by-station', deviceByStation);
router.post('/all-terminal-monitoring-latest', getAllTerminalLatestMonitoringController);
router.post('/terminal-by-station', terminalByStation);
router.post('/monitoring-summary', monitoringSummary);

export default router;
