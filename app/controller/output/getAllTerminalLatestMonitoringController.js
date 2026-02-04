import { response_error, response_success_data } from "../../config/response.js";
import { saveError } from "../../service/error-service.js";
import { getAllTerminalLatestMonitoringAllStationService, getAllTerminalLatestMonitoringAllStationServiceByProject  } from "../../service/output/getAllTerminalLatestMonitoringService.js";

const controller = async (req, res) => {
    try {
        const { c_project } = req.body;
console.log("Start c_project", c_project)
        if (!req.body.c_project) {
            const result = await getAllTerminalLatestMonitoringAllStationService();

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Success",
            data: result.data
        });
        } else {
        const result = await getAllTerminalLatestMonitoringAllStationServiceByProject({
            c_project: req.body.c_project
        });

        if (result.code !== 0) throw result;

        return response_success_data({
            res,
            status: "00",
            message: "Success",
            data: result.data
        });
        }


        

    } catch (err) {
        await saveError(err.code, err.message, JSON.stringify(err));
        return response_error({
            res,
            status: "1004",
            message: {
                ina: "SEDANG TIDAK DAPAT MELAKUKAN TRANSAKSI",
                eng: "THE SYSTEM IS UNDER MAINTENANCE"
            },
            data: err
        });
    }
};

export default controller;