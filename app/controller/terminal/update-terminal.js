import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { updateTerminal } from "../../service/terminal/update-terminal-service.js";

const controller = async (req, res) => {
    try {
        const { c_terminal_sn } = req.body;
        const updatedBy = req.user?.username || "system";

        if (!c_terminal_sn) {
        throw {
            code: "4000",
            message: "c_terminal_sn is required"
        };
        }

        const result = await updateTerminal(req.body, updatedBy);

        if (result.code !== 0) throw result;

        return response_success_data({
        res,
        status: "00",
        message: "Terminal updated successfully",
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
