import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { addTerminalService } from "../../service/terminal/add-terminal-service.js";

const controller = async (req, res) => {
    try {

        const {
            c_terminal_01,
            c_project,
            c_station
        } = req.body;

        const createdBy = req.user?.username || req.username || "system";

        /* =========================
            VALIDASI REQUIRED
           ========================= */
        if (!c_terminal_01 || !c_project || !c_station) {
            throw {
                code: "4000",
                message: "c_terminal_01, c_project dan c_station wajib diisi"
            };
        }

        const result = await addTerminalService(req.body, createdBy);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Terminal successfully created",
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
