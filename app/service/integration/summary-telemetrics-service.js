import db from "../../config/database.js";

const normalize = (s) => (s ? s.toUpperCase() : "NO_DATA");

export const getSummaryTelemetricsService = async (c_project) => {
    try {

        /** 1️⃣ GET TERMINAL + STATION */
        let terminalQuery = db("master.t_m_terminal as t")
            .select(
                "t.c_project",
                "t.c_terminal_sn",
                "t.c_terminal_type",
                "t.c_station",
                "t.n_terminal_name",
                "st.n_station",
                "p.n_project_name",
                "p.n_project_desc"
            )
            .leftJoin("config.t_d_station as st", function () {
                this.on("st.c_project", "=", "t.c_project")
                    .andOn(db.raw("TRIM(st.c_station)"), "=", db.raw("TRIM(t.c_station)"));
            })
            .leftJoin("config.t_d_project as p", "p.c_project", "t.c_project")
            .where("t.b_active", true)
            .whereNotNull("t.c_terminal_sn")
            .whereNull("t.d_deleted_at");

        if (c_project) {
            terminalQuery.andWhere("t.c_project", c_project);
        }

        const terminals = await terminalQuery;

        /** 2️⃣ GET ALL METRICS CONFIG */
        const metricsConfig = await db("config.t_m_terminal_metrics")
            .where("b_active", true);

        /** 3️⃣ GROUP CONFIG PER TYPE */
        const metricsMap = {};
        metricsConfig.forEach(m => {
            const key = `${m.c_project}_${m.c_terminal_type}`;
            if (!metricsMap[key]) metricsMap[key] = [];
            metricsMap[key].push(m);
        });

        /** 4️⃣ GET LAST MONITORING */
        const latestMonitoring = await db.raw(`
            SELECT DISTINCT ON (c_terminal_sn, c_project)
                c_terminal_sn,
                c_project,
                data,
                d_monitoring
            FROM opr.t_d_monitoring_device
            ORDER BY c_terminal_sn, c_project, d_monitoring DESC
        `);

        const monitoringMap = new Map();
        latestMonitoring.rows.forEach(m => {
            monitoringMap.set(`${m.c_project}_${m.c_terminal_sn}`, m);
        });

        /** 5️⃣ GET NETWORK SETTING */
        const settings = await db("master.t_m_setting")
            .where("c_setting_key", "terminal_network_check_interval")
            .where("b_active", true);

        const settingMap = {};
        settings.forEach(s => {
            settingMap[s.c_project] = parseInt(s.c_setting_value);
        });

        const now = new Date();

        /** 6️⃣ BUILD STATION MAP */
        const stationMap = {};

        for (const t of terminals) {

            const stationKey = `${t.c_project}_${t.c_station}`;

            if (!stationMap[stationKey]) {
                stationMap[stationKey] = {
                    c_project: t.c_project,
                    n_project_name: t.n_project_name,
                    n_project_desc: t.n_project_desc,
                    c_station: t.c_station,
                    n_station: t.n_station,
                    terminal: []
                };
            }

            const configKey = `${t.c_project}_${t.c_terminal_type}`;
            const configs = metricsMap[configKey] || [];

            const monitoring = monitoringMap.get(`${t.c_project}_${t.c_terminal_sn}`);

            const monitoringData = monitoring?.data || [];
            const lastTime = monitoring?.d_monitoring ? new Date(monitoring.d_monitoring) : null;

            const interval = settingMap[t.c_project] || 5;
            let matricsSend = [];
            let hasDanger = false;
            let hasWarning = false;

            for (const metric of configs) {

                if (metric.c_metrics_type === "network") {

                    const isDown = !lastTime || (now - lastTime > interval * 60000);
                    console.log(`Checking network for terminal ${t.c_terminal_sn} - Last monitoring: ${lastTime}, Now: ${now}, Interval: ${interval} mins, IsDown: ${isDown}`);
                    if (isDown) {
                        hasDanger = true;
                        matricsSend.push({
                        status : "DOWN",
                        measure: "DOWN",
                        c_data_type: metric.c_data_type,
                        notes: "No monitoring data within interval"
                        });
                    }
                    continue;
                }

                const found = monitoringData.find(
                    m => m.c_data_type === metric.c_data_from
                );

                const status = normalize(found?.status);

                if (status === "DANGER") {
                    hasDanger = true;
                    matricsSend.push({
                        status : found?.status || "DANGER",
                        measure: found?.measure || "DANGER",
                        c_data_type: metric.c_data_type,
                        notes: found?.notes || null
                    });
                } else if (status === "WARNING") {
                    hasWarning = true;
                    matricsSend.push({
                        status : found?.status || "WARNING",
                        measure: found?.measure || "WARNING",
                        c_data_type: metric.c_data_type,
                        notes: found?.notes || null
                    });
                }
            }

            let terminalStatus = "NORMAL";

            if (hasDanger) terminalStatus = "DANGER";
            else if (hasWarning) terminalStatus = "WARNING";

            stationMap[stationKey].terminal.push({
                c_terminal_sn: t.c_terminal_sn,
                n_terminal_name: t.n_terminal_name,
                d_monitoring: toJakartaTime(lastTime) || null,
                status: terminalStatus,
                matrics: matricsSend
            });
        }

        /** 7️⃣ CLASSIFY */
        let green_station = 0;
        let warning_station = 0;
        let danger_station = 0;

        const list_danger = [];
        const list_warning = [];

        Object.values(stationMap).forEach(st => {

            const hasDanger = st.terminal.some(t => t.status === "DANGER");
            const hasWarning = st.terminal.some(t => t.status === "WARNING");
            // console.log(st.c_station, "=>", hasDanger, hasWarning);
            if (hasDanger) {
                danger_station++;

                list_danger.push({
                    ...st,
                    terminal: st.terminal.filter(t => t.status === "DANGER")
                });

            } else if (hasWarning) {
                warning_station++;

                list_warning.push({
                    ...st,
                    terminal: st.terminal.filter(t => t.status === "WARNING")
                });

            } else {
                green_station++;
            }
        });

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
            message: "Failed summary telemetrics",
            data: err
        };
    }
};