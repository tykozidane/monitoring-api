import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { getDataTypeThresholdService } from "../../service/data-type/get-threshold-service.js";

const controller = async (req, res) => {
    try {

        const { c_project, c_terminal_type } = req.body;

        const result = await getDataTypeThresholdService(c_project, c_terminal_type);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Success",
            data: result.message
        });

    } catch (err) {
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