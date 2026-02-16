import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import {
    getSettingsByProject,
    getTerminal,
    getDevices
} from "../../service/terminal/terminal-config-service.js";

const controller = async (req, res) => {
    try {
        const { c_project, c_terminal_sn } = req.body;

        if (!c_project || !c_terminal_sn) {
        throw {
            code: "4000",
            message: "c_project and c_terminal_sn are required"
        };
        }

        // ðŸ”§ Setting
        const settings = await getSettingsByProject(c_project);

        // ðŸ–¥ Terminal
        const terminal = await getTerminal(c_terminal_sn, c_project);
        if (!terminal) {
        throw {
            code: "4040",
            message: "Terminal not found or inactive"
        };
        }

        // ðŸ”Œ Devices
        const devices = await getDevices(c_terminal_sn);

        // Convert device list â†’ object
        const deviceObject = {};
        for (const dev of devices) {
        deviceObject[dev.c_device] = {
            serialnumber: dev.c_serial_number
        };
        }

        return response_success_data({
        res,
        status: "00",
        message: "Terminal config retrieved successfully",
        data: {
            ...settings,

            c_terminal_sn: terminal.c_terminal_sn,
            c_project: terminal.c_project.toUpperCase(),
            c_terminal_type: terminal.c_terminal_type,
            i_terminal_type: terminal.i_terminal_type || null,
            c_station: terminal.c_station,

            ...deviceObject
        }
        });

    } catch (err) {
        await saveError(err.code, err.message, JSON.stringify(err));
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
