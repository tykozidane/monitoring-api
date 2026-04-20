import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { getListMapStationService } from "../../service/station/list-map-station-service.js";

const controller = async (req, res) => {
    try {

        const { c_project } = req.body;

        const result = await getListMapStationService(c_project);

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