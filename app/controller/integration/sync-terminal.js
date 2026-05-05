import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { insertItem } from "../../service/integration/sync-terminal-service.js";

const controller = async (req, res) => {
    try {
        const { item_serial_code, item, serial_number } = req.body;
        const createdBy = req.user?.username || "system";
        const signature = req.headers["x-signature"];

        if (!item_serial_code || !serial_number) {
        throw {
            code: "4000",
            message: "item_serial_code and serial_number are required"
        };
        }

        if (!Array.isArray(item)) {
        throw {
            code: "4001",
            message: "item must be array of object"
        };
        }

        const result = await insertItem(req.body, createdBy, signature);

        if (result.code !== 0) throw result;

        return response_success_data({
        res,
        status: "00",
        message: "Item created successfully",
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
