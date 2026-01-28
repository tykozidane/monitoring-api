import express from 'express';
import dataMonitoring from './data_monitoring.js';
import sendDataMonit from './send-data-monitoring.js';
import dataMonitMini from './data-monit-mini.js';
import dataMonitFromDevice from './data-monit-from-device.js';
import transactionMonitFromDevice from './transaction-monit-from-device.js';
import basicAuth from '../middleware/basic-auth.js';
const router = express.Router();

router.post('/data-monitoring',  dataMonitoring);
router.post('/send-data', sendDataMonit);
router.post('/device-send-data',basicAuth, dataMonitFromDevice);   //New Concept
router.post('/device-send-transaction',basicAuth, transactionMonitFromDevice);   //New Concept
router.post('/mini',express.text(), dataMonitMini);

export default router;
