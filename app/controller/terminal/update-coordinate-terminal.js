import {
    response_success,
    response_error,
    response_success_data
} from "../../config/response.js";

import { updateTerminalCoordinateService } from "../../service/terminal/update-coordinate-terminal-service.js";

const controller = async (req, res) => {
    try {

        const user = req.username || "system";

        const result = await updateTerminalCoordinateService(req.body, user);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: result.message
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