import express from 'express';
import dataMonitoring from './data_monitoring.js';
import sendDataMonit from './send-data-monitoring.js';
import dataMonitMini from './data-monit-mini.js';
const router = express.Router();

router.post('/data-monitoring', dataMonitoring);
router.post('/send-data', sendDataMonit);
router.post('/mini',express.text(), dataMonitMini);

export default router;
