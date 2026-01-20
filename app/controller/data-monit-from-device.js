import { response_success, response_error } from "../config/response.js";
import { saveMonitoringGateService } from "../service/data-monit-from-device-service.js";
import { saveError } from "../service/error-service.js";

const controller = async (req, res) => {
    try {
        const result = await saveMonitoringGateService(req.body);

        if (result.code !== 0) throw result;

        return response_success({
            res,
            status: "00",
            message: "Monitoring gate berhasil diproses"
        });
    } catch (err) {
        await saveError(err.code, err.message, JSON.stringify(err));
        return response_error({
            res,
            status: "1004",
            message: {
                ina: "SEDANG TIDAK DAPAT MELAKUKAN TRANSAKSI \nSILAHKAN HUBUNGI PETUGAS \n(2)",
                eng: "THE SYSTEM IS UNDER MAINTENANCE"
            },
            data: err
        });
    }
};

export default controller;
