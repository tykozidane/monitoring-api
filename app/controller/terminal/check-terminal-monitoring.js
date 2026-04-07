import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import { getTerminalLatestMonitoringService } from "../../service/terminal/check-terminal-monitoring-service.js";
function convertToJakartaTime(date) {
    if (!date) return null;

    const jakarta = new Date(
        new Date(date).toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const yyyy = jakarta.getFullYear();
    const mm = String(jakarta.getMonth() + 1).padStart(2, "0");
    const dd = String(jakarta.getDate()).padStart(2, "0");
    const hh = String(jakarta.getHours()).padStart(2, "0");
    const mi = String(jakarta.getMinutes()).padStart(2, "0");
    const ss = String(jakarta.getSeconds()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
const controller = async (req, res) => {
    try {

        const { c_project } = req.query;

        const result = await getTerminalLatestMonitoringService(c_project);

        if (result.code !== 0) throw result;
        const data = result.message.map(item => ({
            c_terminal_sn: item.c_terminal_sn,
            n_terminal_name: item.n_terminal_name,
            latest_time_monitoring: convertToJakartaTime(item.latest_time_monitoring)
        }));
        return response_success_data({
            res,
            status: "00",
            message: "Success",
            data
        });

    } catch (err) {

        await saveError(
            err.code,
            err.message,
            JSON.stringify(err)
        );

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