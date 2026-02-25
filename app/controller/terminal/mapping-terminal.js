import {
    response_success,
    response_error,
    response_success_data
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { mappingTerminalService } from "../../service/terminal/mapping-terminal-service.js";

const controller = async (req, res) => {
    try {

        const updatedBy = req.user?.username || "system";

        const result = await mappingTerminalService(
            req.body,
            updatedBy
        );

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Mapping Terminal berhasil diproses",
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
