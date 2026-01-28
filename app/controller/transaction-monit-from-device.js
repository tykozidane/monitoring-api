import { response_success, response_error } from "../config/response.js";
import { saveError } from "../service/error-service.js";

const controller = async (req, res) => {
    try {
        let {} = req.body;
        console.log(req.body);
        return response_success({
            res,
            status: "00",
            message: "Monitoring Transaction berhasil diproses"
        });
    } catch (err) {
        await saveError(err.code, err.message, JSON.stringify(err));
        return response_error({
            res,
            status: "1005",
            message: {
                ina: "SEDANG TIDAK DAPAT MELAKUKAN TRANSAKSI \nSILAHKAN HUBUNGI PETUGAS \n(2)",
                eng: "THE SYSTEM IS UNDER MAINTENANCE"
            },
            data: err
        });
    }
};

export default controller;
