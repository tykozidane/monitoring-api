import {
    response_success_data,
    response_error
} from "../../config/response.js";
import { getDeviceByTerminalService } from "../../service/device/get-device-by-terminal-service.js";

import { saveError } from "../../service/error-service.js";

const controller = async (req, res) => {
    try {

        // const { c_terminal_sn } = req.params;
        const { c_project, c_terminal_sn } = req.query;

        if (!c_terminal_sn) {
            throw {
                code: "4000",
                message: "c_terminal_sn parameter is required"
            };
        }

        if (!c_project) {
            throw {
                code: "4001",
                message: "c_project parameter is required"
            };
        }

        const result = await getDeviceByTerminalService(
            c_terminal_sn,
            c_project
        );

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