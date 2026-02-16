import {
    response_success,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { releaseTerminalService } from "../../service/terminal/release-terminal-service.js";

const controller = async (req, res) => {
    try {

        const { c_terminal_sn, c_project } = req.body;

        if (!c_terminal_sn || !c_project) {
            throw {
                code: "4000",
                message: "c_terminal_sn dan c_project wajib diisi"
            };
        }

        const updatedBy = req.user?.username || "system";

        const result = await releaseTerminalService(
            c_terminal_sn,
            c_project,
            updatedBy
        );

        if (result.code !== 0) throw result;

        return response_success({
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
