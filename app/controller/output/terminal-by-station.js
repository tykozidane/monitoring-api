import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { getTerminalByStation } from "../../service/output/terminal-by-station-service.js";
import { saveError } from "../../service/error-service.js";

const controller = async (req, res) => {
    try {
        const { c_station, c_project } = req.body;

        if (!c_station || !c_project) {
        throw {
            code: "4000",
            message: "c_station and c_project are required"
        };
        }

        const result = await getTerminalByStation(c_station, c_project);

        if (result.code !== 0) throw result;

        return response_success_data({
        res,
        status: "00",
        message: "Success",
        data: result.message
        });

    } catch (err) {
        await saveError(err.code, err.message, JSON.stringify(err));
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
