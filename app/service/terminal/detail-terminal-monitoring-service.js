import db from "../../config/database.js";
import toJakartaTime from "../../middleware/time-convert.js";
const normalize = (s) => (s ? s.toUpperCase() : "NO_DATA");

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

        /* ===============================
            4️⃣ Check Network
        =============================== */

        /**  GET NETWORK SETTING */
        const settings = await db("master.t_m_setting")
            .where("c_setting_key", "terminal_network_check_interval")
            .where("c_project", c_project || null)
            .where("b_active", true)
            .first();

        const networkCheckInterval = settings ? parseInt(settings.c_setting_value) : 5; // default 5 menit
        const now = new Date();
        const lastMonitoringTime = new Date(result.d_monitoring);
        if(now - lastMonitoringTime > networkCheckInterval * 60000){
            result.n_status = "DANGER";
            result.data.push({
                "notes": "No monitoring data within interval",
				"value": 1,
				"status": "DOWN",
				"measure": "DOWN",
				"c_data_type": "NETWORK_USAGE"
            })
        }
        result.d_monitoring = toJakartaTime(result.d_monitoring);
        result.n_status = normalize(result.n_status);
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