import db from "../../config/database.js";

export const getMonitoringSummaryService = async (c_project) => {
    try {

        /* ===============================
            1️⃣ GET LATEST MONITORING PER TERMINAL
        =============================== */

        const latestMonitoring = await db.raw(`
            SELECT DISTINCT ON (c_terminal_sn, c_project)
                c_terminal_sn,
                c_project,
                TRIM(c_station) as c_station,
                d_monitoring,
                n_status
            FROM opr.t_d_monitoring_device
            ORDER BY c_terminal_sn, c_project, d_monitoring DESC
        `);

        const monitoringMap = new Map();

        latestMonitoring.rows.forEach(m => {
            const key = `${m.c_project}_${m.c_terminal_sn}`;
            monitoringMap.set(key, m);
        });

        /* ===============================
            2️⃣ GET TERMINAL + STATION
        =============================== */

        let query = db
            .select(
                "st.c_project",
                "p.n_project_name",
                "p.n_project_desc",
                db.raw("TRIM(st.c_station) as c_station"),
                "st.n_station",
                "st.n_lat",
                "st.n_lng",

                "t.c_terminal_sn",
                "t.n_terminal_name",
                "t.n_lat as t_lat",
                "t.n_lng as t_lng"
            )
            .from({ st: "config.t_d_station" })

            .leftJoin({ p: "config.t_d_project" }, "st.c_project", "p.c_project")

            .leftJoin({ t: "master.t_m_terminal" }, function () {
                this.on("t.c_project", "=", "st.c_project")
                    .andOn(db.raw("TRIM(t.c_station)"), "=", db.raw("TRIM(st.c_station)"))
                    .andOn("t.b_active", "=", db.raw("true"))
                    .andOnNull("t.d_deleted_at");
            })

            .where("st.b_active", true);

        if (c_project) {
            query.andWhere("st.c_project", c_project);
        }

        const rows = await query;

        /* ===============================
            3️⃣ GROUP BY STATION
        =============================== */

        const stationMap = {};

        for (const row of rows) {

            const key = `${row.c_project}_${row.c_station}`;

            if (!stationMap[key]) {
                stationMap[key] = {
                    c_project: row.c_project,
                    n_project_name: row.n_project_name,
                    n_project_desc: row.n_project_desc,
                    c_station: row.c_station,
                    n_station: row.n_station,
                    n_lat: row.n_lat,
                    n_lng: row.n_lng,
                    status: "GREEN",
                    terminal: []
                };
            }

            if (!row.c_terminal_sn) continue;

            const mapKey = `${row.c_project}_${row.c_terminal_sn}`;
            const monitoring = monitoringMap.get(mapKey);

            let status = "NO_DATA";

            if (monitoring) {
                status = monitoring.n_status?.toUpperCase() || "NO_DATA";
            }

            const terminalData = {
                n_terminal_name: row.n_terminal_name,
                c_terminal_sn: row.c_terminal_sn,
                n_lat: row.t_lat,
                n_lng: row.t_lng,
                d_monitoring: monitoring?.d_monitoring || null,
                status
            };

            stationMap[key].terminal.push(terminalData);
        }

        /* ===============================
            4️⃣ CLASSIFY STATION
        =============================== */

        let green_station = 0;
        let warning_station = 0;
        let danger_station = 0;

        const list_danger = [];
        const list_warning = [];

        Object.values(stationMap).forEach(st => {

            const hasDanger = st.terminal.some(t => t.status === "DANGER");
            const hasWarning = st.terminal.some(t => t.status === "WARNING");

            if (hasDanger) {

                const filteredTerminal = st.terminal.filter(t => t.status === "DANGER");

                st.status = "DANGER";
                danger_station++;

                list_danger.push({
                    ...st,
                    terminal: filteredTerminal
                });

            }
            else if (hasWarning) {

                const filteredTerminal = st.terminal.filter(t => t.status === "WARNING");

                st.status = "WARNING";
                warning_station++;

                list_warning.push({
                    ...st,
                    terminal: filteredTerminal
                });

            }
            else {
                st.status = "GREEN";
                green_station++;
            }

        });

        /* ===============================
            5️⃣ RESPONSE
        =============================== */

        return {
            code: 0,
            message: {
                green_station,
                warning_station,
                danger_station,
                list_danger,
                list_warning
            }
        };

    } catch (err) {

        return {
            code: "5000",
            message: "Failed to get monitoring summary",
            data: err
        };

    }
};