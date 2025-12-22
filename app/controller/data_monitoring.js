import { response_success, response_error } from "../config/response.js";


const controller = async (req, res) => {
    try {
        var {
            uid_var,
            name_var,
            unit_int,
            prefix_int,
            type_int,
            value_flo,
            ts_int
        } = req.body



        return response_success({res: res, message:"Success", status: "00", data: {
            uid_var: uid_var,
            name_var: name_var,
            unit_int: unit_int,
            prefix_int: prefix_int,
            type_int: type_int,
            value_flo: value_flo,
            ts_int : ts_int
        }})
    } catch (err) {
        return response_error({res: res, status: "1001", message: err.message, code: "1", data: err})
    }
}

export default controller;