import { response_success, response_error, response_success_data } from "../../config/response.js";
import { saveError } from "../../service/error-service.js";
import { getTerminalByStation } from "../../service/output/terminal-by-station-service.js";


const controller = async (req, res) => {
    try {
        var {c_station, c_project} = req.body
        const getdata = await getTerminalByStation(c_project, c_station)
        var {code , message} = getdata
        if(code != 0) throw getdata

        return response_success_data({ res, message: "Success", status: "00", data: message });
    } catch (err) {
        const saveDataError = await saveError()
        return response_error({ res, status: "2007", message: err.message, code: "2", data: err });
    }
};

export default controller;
