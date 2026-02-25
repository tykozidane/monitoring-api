import db from "../../config/database.js";

export const getDataMappingTerminalSyncService = async (
    serial_number,
    c_project
) => {
    try {

        /* =========================
            1️⃣ SYNC TERMINAL
        ========================== */
        const syncTerminal = await db("sync.t_m_sync_terminal")
            .select(
                "i_id",
                "item_serial_code",
                "client_name",
                "model_code",
                "model_name",
                "station_code",
                "station_name",
                "location",
                "note",
                "item",
                "d_sync",
                "b_mapping",
                "c_signature",
                "serial_number"
            )
            .where({
                serial_number,
                c_project,
                b_active: true
            })
            .first();

        /* =========================
            2️⃣ TERMINAL
        ========================== */
        const terminal = await db("master.t_m_terminal")
            .select(
                "i_id",
                "c_terminal_sn",
                "c_terminal_01",
                "c_terminal_02",
                "c_terminal_type",
                "c_project",
                "c_station",
                "n_terminal_name",
                "n_lat",
                "n_lng",
                "b_active",
                "c_signature",
                "i_sync_id",
                "c_model_code",
                "c_model_name",
                "c_item_serial_code"
            )
            .where({
                c_terminal_sn: serial_number,
                b_active: true
            })
            .whereNull("d_deleted_at")
            .first();

        let terminalData = null;

        if (terminal) {

            /* =========================
                3️⃣ DEVICES
            ========================== */
            const devices = await db("master.t_m_device")
                .select(
                    "i_id",
                    "c_device",
                    "c_serial_number",
                    "c_device_type",
                    "c_direction",
                    "n_device_name",
                    "c_project",
                    "c_terminal_sn",
                    "b_active",
                    "sub_item_type",
                    "sub_item_code",
                    "sub_item_serial_code"
                )
                .where({
                    c_terminal_sn: serial_number,
                    b_active: true
                })
                .whereNull("d_deleted_at");

            terminalData = {
                ...terminal,
                devices
            };
        }

        return {
            code: 0,
            message: {
                sync_terminal: syncTerminal || null,
                terminal: terminalData
            }
        };

    } catch (err) {
        return {
            code: "5200",
            message: "Failed to get data mapping terminal sync",
            data: err
        };
    }
};
