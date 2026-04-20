import {
    response_success_data,
    response_error
} from "../../config/response.js";
import { getSummaryTelemetricsService } from "../../service/integration/summary-telemetrics-service.js";


const controller = async (req, res) => {
    try {

        const { c_project } = req.body;

        const result = await getSummaryTelemetricsService(c_project);

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