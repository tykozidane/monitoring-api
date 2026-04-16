import { response_error, response_success_data } from "../../config/response.js";
import { saveError } from "../../service/error-service.js";
import { getMonitoringSummaryService } from "../../service/output/monitoring-summary-service.js";

const controller = async (req, res) => {
    try {

        const { c_project } = req.body;

        const result = await getMonitoringSummaryService(c_project);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Success",
            data: result.message
        });

    } catch (err) {

        await saveError(err);

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