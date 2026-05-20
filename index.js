import express from "express";
const app = express();
import { request, response } from './app/middleware/logger.js';
import * as uuid from 'uuid'
import 'dotenv/config'
import monit from './app/controller/monit.routes.js';
import output from './app/controller/output/output.routes.js'
import terminal from './app/controller/terminal/terminal.routes.js'
import integration from './app/controller/integration/integration.routes.js'
import station from './app/controller/station/station.routes.js'
import device from './app/controller/device/device.routes.js'
import project from './app/controller/project/project.routes.js'
import dataType from './app/controller/data-type/data-type.routes.js'
import appRoutes from './app/controller/app/app.routes.js';
import auth from './app/controller/auth/auth.routes.js';
import basicAuth from './app/middleware/basic-auth.js';
import cors from 'cors';
import db from "./app/config/database.js";
import elasticClient from "./app/config/elasticsearch.js";
import { startMonitoringServerCron } from "./app/cron/monitoring-server-cron.js";
// import { runServerMonitoringCron } from "./app/cron/maping-monitoring-server-cron.js";
import "./app/cron/maping-monitoring-server-cron.js";
import "./app/cron/gate-transaction-cron.js";
// import { encrypt } from "./app/utils/crypto.js";
// import cron from "node-cron";
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const originalSend = app.response.send;
app.response.send = function sendOverWrite(body) {
  originalSend.call(this, body);
  this.__custombody__ = body;
};

//get request ID
app.use((req, res, next) => {
  req.headers.idReq = uuid.v4();
  next();
});
app.use(request);
app.use(response);

var router = express.Router();

app.get("/", async (req, res) => {
  return res.status(200).send("Connect!");
});

// app.use(basicAuth)
app.use("/api/v1", router);
router.use("/monit", monit);
router.use("/output", output);
router.use("/terminal", terminal);
router.use("/integration", integration);
router.use("/station", station);
router.use("/device", device);
router.use("/project", project);
router.use("/app", appRoutes);
router.use("/auth", auth);
router.use("/data-type", dataType);

//CRON
startMonitoringServerCron();
// runServerMonitoringCron();
// cron.schedule("10 */2 * * * *", async () => {
//   runServerMonitoringCron();
// });
const port = process.env.APP_PORT || 5000;
app.listen(port, () => {
  testConnection();
  console.log(`System is listening to port http://localhost:${port}`);
});

const testConnection = async () => {
  try {
    await db.raw("select 1");
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  }

  try {
    await elasticClient.info();
    console.log("✅ Elasticsearch connected");
  } catch (err) {
    console.error("❌ Elasticsearch connection failed:", err.message);
  }
};
