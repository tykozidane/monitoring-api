import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { getDeviceTelemetrics } from "../../service/integration/device-telemetrics-service.js";

const controller = async (req, res) => {
    try {
        const { c_project, serial_number } = req.query;

        if (!c_project || !serial_number) {
        throw { code: "400", message: "c_project and serial_number required" };
        }

        const result = await getDeviceTelemetrics(c_project, serial_number);

        if (result.code !== 0) throw result;

        return response_success_data({
        res,
        status: "00",
        message: "Success",
        data: result.message
        });

    } catch (err) {
        return response_error({
        res,
        status: "2001",
        code: "1",
        message: err.message,
        data: err
        });
    }
};

export default controller;
