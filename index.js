import express from 'express'
const app = express();
import { request, response } from './app/middleware/logger.js';
import * as uuid from 'uuid'
import 'dotenv/config'
import monit from './app/controller/monit.routes.js';
import output from './app/controller/output/output.routes.js'
import terminal from './app/controller/terminal/terminal.routes.js'
import basicAuth from './app/middleware/basic-auth.js';
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


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

app.get("/", (req, res) => {
    return res.status(200).send("Connect!");
});

// app.use(basicAuth)
app.use("/api/v1", router);
router.use("/monit", monit);
router.use("/output", output);
router.use("/terminal", terminal);

const port = process.env.APP_PORT || 5000;
app.listen(port, () => {
    console.log(`System is listening to port ${port}`);
});
