import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { getAllStationMiniService } from "../../service/station/get-all-station-mini-service.js";

const controller = async (req, res) => {
    try {

        const { c_project } = req.query;

        if (!c_project) {
            throw {
                code: "4000",
                message: "c_project parameter is required"
            };
        }

        const result = await getAllStationMiniService(c_project);

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
