import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { getAppUpdateService } from "../../service/app/get-app-update-service.js";

const controller = async (req, res) => {
    try {

        const result = await getAppUpdateService(req.query);

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
            message: err.message,
            code: "1"
        });
    }
};

export default controller;