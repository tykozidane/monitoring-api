import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { rollbackReleaseTerminalService } from "../../service/terminal/rollback-release-terminal-service.js";

const controller = async (req, res) => {
    try {

        const {
            c_project,
            c_station,
            c_terminal_01,
            c_terminal_type
        } = req.body;

        if (!c_project || !c_station || !c_terminal_01 || !c_terminal_type) {
            throw {
                code: "4000",
                message: "Required fields are missing"
            };
        }

        const updatedBy = req.user?.username || "system";

        const result = await rollbackReleaseTerminalService(req.body, updatedBy);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: result.message
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