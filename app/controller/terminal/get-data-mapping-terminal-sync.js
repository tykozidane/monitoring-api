import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { getDataMappingTerminalSyncService } from "../../service/terminal/get-data-mapping-terminal-sync-service.js";

const controller = async (req, res) => {
    try {

        const { serial_number, c_project } = req.body;

        if (!serial_number || !c_project) {
            throw {
                code: "4000",
                message: "serial_number dan c_project wajib diisi"
            };
        }

        const result = await getDataMappingTerminalSyncService(
            serial_number,
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
