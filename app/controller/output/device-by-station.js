import { response_success, response_error, response_success_data } from "../../config/response.js";
import { saveError } from "../../service/error-service.js";
import { getDeviceByStation } from "../../service/output/device-by-station-service.js";


const controller = async (req, res) => {
    try {
        var {c_station} = req.body
        const getdata = await getDeviceByStation(c_station)
        var {code , message} = getdata
        if(code != 0) throw getdata

        return response_success_data({ res, message: "Success", status: "00", data: message });
    } catch (err) {
        const saveDataError = await saveError()
        return response_error({ res, status: "2002", message: err.message, code: "2", data: err });
    }
};

export default controller;
