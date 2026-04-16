import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { getDetailTerminalMonitoringService } from "../../service/terminal/detail-terminal-monitoring-service.js";

const controller = async (req, res) => {
    try {

        const { c_project, c_terminal_sn, c_station } = req.body;

        if (!c_project || !c_terminal_sn || !c_station) {
            throw {
                code: "4000",
                message: "c_project, c_terminal_sn, and c_station are required"
            };
        }

        const result = await getDetailTerminalMonitoringService(req.body);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Success",
            data: result.message
        });

    } catch (err) {

        await saveError(
            err.code,
            err.message,
            JSON.stringify(err)
        );

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