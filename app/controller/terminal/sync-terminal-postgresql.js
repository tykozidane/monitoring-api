import {
    response_success_data,
    response_error
} from "../../config/response.js";

import { saveError } from "../../service/error-service.js";
import {
    getTerminalBySN,
    insertTerminal,
    updateTerminal,
    getDevicesByTerminal,
    insertDevice,
    updateDevice,
    softDeleteDevice
} from "../../service/terminal/sync-terminal-postgresql-service.js";

const controller = async (req, res) => {
    // const trx = await req.db.transaction();

    try {
        const {
        c_terminal_sn,
        c_project,
        devices = [],
        ...terminalData
        } = req.body;

        const user = req.username || "system";

        if (!c_terminal_sn || !c_project) {
        throw {
            code: "4000",
            message: "c_terminal_sn and c_project are required"
        };
        }

        // 🔍 Check terminal
        const terminal = await getTerminalBySN(c_terminal_sn);

        let terminalResult;
        if (!terminal) {
        // ➕ INSERT TERMINAL
        terminalResult = await insertTerminal(
            {
            c_terminal_sn,
            c_project,
            ...terminalData
            },
            user
        );
        } else {
        // ✏️ UPDATE TERMINAL
        terminalResult = await updateTerminal(
            c_terminal_sn,
            {
            c_project,
            ...terminalData
            },
            user
        );
        }

        // 🔄 SYNC DEVICE
        const dbDevices = await getDevicesByTerminal(c_terminal_sn);
        const incomingCodes = devices.map(d => d.c_device);

        // ❌ Soft delete device yang tidak dikirim
        for (const dbDev of dbDevices) {
        if (!incomingCodes.includes(dbDev.c_device)) {
            await softDeleteDevice(
            c_terminal_sn,
            dbDev.c_device,
            user
            );
        }
        }

        // ➕➖ Insert / Update device
        for (const dev of devices) {
        const exist = dbDevices.find(
            d => d.c_device === dev.c_device
        );

        if (exist) {
            await updateDevice(
            dev,
            c_terminal_sn,
            c_project,
            user
            );
        } else {
            await insertDevice(
            dev,
            c_terminal_sn,
            c_project,
            user
            );
        }
        }

        return response_success_data({
        res,
        status: "00",
        message: "Terminal & device synced successfully",
        data: terminalResult
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