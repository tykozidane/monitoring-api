import {
    response_success_data,
    response_error
} from "../config/response.js";
import { saveElasticMonitoringService } from "../service/data-monit-server-service.js";


const controller = async (req, res) => {
    try {


        const result = await saveElasticMonitoringService(req.body);

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Monitoring data saved to ElasticSearch",
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