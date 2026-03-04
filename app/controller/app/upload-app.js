import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { uploadAppService } from "../../service/app/upload-app-service.js";

const controller = async (req, res) => {
    try {

        if (!req.file) {
            throw {
                code: "4000",
                message: "File is required"
            };
        }

        const createdBy = req.user?.username || "system";

        const result = await uploadAppService(
            req.body,
            req.file,
            createdBy
        );

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "App uploaded successfully",
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