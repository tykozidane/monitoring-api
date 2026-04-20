import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { getTerminalCoordinateService } from "../../service/terminal/list-terminal-coordinate-service.js";

const controller = async (req, res) => {
    try {

        const { c_project, c_station } = req.body;

        const result = await getTerminalCoordinateService(c_project, c_station);

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