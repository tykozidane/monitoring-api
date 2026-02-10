import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { updateTerminal } from "../../service/terminal/update-terminal-service.js";

const ALLOWED_UPDATE_FIELDS = [
    "c_terminal_01",
    "c_terminal_02",
    "c_terminal_type",
    "c_project",
    "c_station",
    "n_terminal_name",
    "a_data",
    "a_device",
    "n_lat",
    "n_lng",
    "b_active"
];

const controller = async (req, res) => {
    try {
        // 🔥 dari middleware validateTerminal
        const existingTerminal = req.terminal;
        const { c_terminal_sn } = existingTerminal;
        const updatedBy = req.user?.username || "system";
        console.log("Updating terminal:", c_terminal_sn);
        if (!existingTerminal) {
        throw {
            code: "4040",
            message: "Terminal data not found for update"
        };
        }

        // 🔧 BUILD UPDATE PAYLOAD (MERGE LOGIC)
        const updatePayload = {};

        for (const field of ALLOWED_UPDATE_FIELDS) {
        if (req.body[field] !== undefined) {
            // gunakan data dari request
            updatePayload[field] = req.body[field];
        } else {
            // fallback ke data existing
            updatePayload[field] = existingTerminal[field];
        }
        }

        // ❌ safety: jangan update PK & audit field
        delete updatePayload.c_terminal_sn;
        delete updatePayload.i_id;
        delete updatePayload.d_created_at;
        delete updatePayload.n_created_by;
        delete updatePayload.d_deleted_at;
        delete updatePayload.n_deleted_by;

        const result = await updateTerminal (
        c_terminal_sn,
        updatePayload,
        updatedBy
        );

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
