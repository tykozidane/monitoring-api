import { response_success, response_error, response_success_data } from "../../config/response.js";
import { saveError } from "../../service/error-service.js";
import { getDetailDevice } from "../../service/output/detail-device-by-c-device-service.js";


const controller = async (req, res) => {
    try {
        var {c_project, c_device} = req.body
        const getdata = await getDetailDevice(c_project, c_device)
        var {code , message} = getdata
        if(code != 0) throw getdata

        return response_success_data({ res, message: "Success", status: "00", data: message });
    } catch (err) {
        const saveDataError = await saveError()
        return response_error({ res, status: "2003", message: err.message, code: "3", data: err });
    }
}; 

export default controller;
