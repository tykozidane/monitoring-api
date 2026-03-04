import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { generateTokenService } from "../../service/auth/generate-token-service.js";

const controller = async (req, res) => {
    try {

        const username = req.query.username;

        const result = await generateTokenService(username);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Token generated successfully",
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