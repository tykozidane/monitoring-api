import db from "../../config/database.js";

export const getDetailTerminalMonitoringService = async (payload) => {
    try {

        const { c_project, c_terminal_sn, c_station } = payload;

        /* ===============================
            1️⃣ VALIDASI TERMINAL
        =============================== */

        const terminal = await db("master.t_m_terminal as t")
            .select(
                "t.c_terminal_sn",
                db.raw("TRIM(t.c_station) as c_station"),
                "t.c_project"
            )
            .where("t.c_project", c_project)
            .where("t.c_terminal_sn", c_terminal_sn)
            .andWhereRaw("TRIM(t.c_station) = TRIM(?)", [c_station])
            .where("t.b_active", true)
            .whereNull("t.d_deleted_at")
            .first();

        if (!terminal) {
            return {
                code: "4041",
                message: "Terminal not found or not active"
            };
        }

        /* ===============================
            2️⃣ AMBIL LATEST MONITORING
        =============================== */

        const result = await db
            .select(
                "c_project",
                "c_terminal_sn",
                db.raw("TRIM(c_station) as c_station"),
                "d_monitoring",
                "data",
                "devices",
                "n_status"
            )
            .from("opr.t_d_monitoring_device")
            .where("c_project", c_project)
            .where("c_terminal_sn", c_terminal_sn)
            .andWhereRaw("TRIM(c_station) = TRIM(?)", [c_station])
            .orderBy("d_monitoring", "desc")
            .first();

        /* ===============================
            3️⃣ HANDLE NO DATA
        =============================== */

        if (!result) {
            return {
                code: 0,
                message: {
                    c_project,
                    c_terminal_sn,
                    c_station: terminal.c_station,
                    d_monitoring: null,
                    data: [],
                    devices: [],
                    n_status: "NO_DATA"
                }
            };
        }

        return {
            code: 0,
            message: result
        };

    } catch (err) {

        return {
            code: "2500",
            message: "Failed to get terminal monitoring detail",
            data: err
        };

    }
};