import { response_success, response_error, response_success_data } from "../../config/response.js";
import { saveError } from "../../service/error-service.js";
import { getAllDataStation } from "../../service/output/send-all-station-service.js";


const controller = async (req, res) => {
    try {

        const { c_project } = req.body;

        const getdata = await getAllDataStation(c_project);

        var { code, message } = getdata;
        if (code != 0) throw getdata;

        return response_success_data({
            res,
            message: "Success",
            status: "00",
            data: message
        });

    } catch (err) {
        await saveError();
        return response_error({
            res,
            status: "2001",
            message: err.message,
            code: "1",
            data: err
        });
    }
};

export default controller;
