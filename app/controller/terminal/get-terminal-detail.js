import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { getTerminalDetail } from "../../service/terminal/get-terminal-detail-service.js";

const controller = async (req, res) => {
    try {
        const { c_terminal_sn, c_project } = req.body;

        if (!c_terminal_sn || !c_project) {
        throw {
            code: "4000",
            message: "c_terminal_sn and c_project are required"
        };
        }

        const result = await getTerminalDetail(c_terminal_sn, c_project);

        if (!result.message) {
        throw {
            code: "4040",
            message: "Terminal not found"
        };
        }

        return response_success_data({
        res,
        status: "00",
        message: "Success",
        data: result.message
        });

    } catch (err) {
        await saveError(err.code, err.message, JSON.stringify(err));

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
