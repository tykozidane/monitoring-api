import db from "../../config/database.js";
import toJakartaTime from "../../middleware/time-convert.js";

const normalize = (s) => (s ? s.toUpperCase() : "NO_DATA");

export const getMonitoringSummaryService = async (c_project) => {
    try {

        /* ===============================
            1️⃣ GET LATEST MONITORING PER TERMINAL
        =============================== */
        // console.log("1 Fetching latest monitoring data...");
        const latestMonitoring = await db.raw(`
            SELECT DISTINCT ON (c_terminal_sn, c_project)
                c_terminal_sn,
                c_project,
                TRIM(c_station) as c_station,
                d_monitoring,
                data,
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
        // console.log("2 Fetching terminal and station data...");
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
        // console.log("3 Grouping data by station...");
        /**  GET NETWORK SETTING */
        const settings = await db("master.t_m_setting")
            .where("c_setting_key", "terminal_network_check_interval")
            .where("c_project", c_project || null)
            .where("b_active", true)
            .first();
        // console.log("Network check interval setting:", settings ? settings.c_setting_value : "Not found");

        /**  GET DATA TYPE */
        const dataTypes = await db("master.t_m_data_type")
            .where("b_active", true)
            .select("c_project", "c_terminal_type", "c_data_type");
        // console.log("DataTyoes:", dataTypes);
        // extract jadi array
        const dataTypeList = dataTypes.map(d => d.c_data_type);

        //Jika akan mengecek Metrics aktifkan ini
        // /** GET ALL METRICS CONFIG */
        // const metricsConfig = await db("config.t_m_terminal_metrics as m")
        // .leftJoin("master.t_m_data_type as d", function () {
        //     this.on("m.c_data_from", "=", "d.c_data_type")
        //         .andOn("m.c_terminal_type", "=", "d.c_terminal_type")
        //         .andOn("d.b_active", "=", db.raw("true"));
        // })
        // .where("m.b_active", true)
        // .whereNull("d.c_data_type");
        // const checkMetrics = metricsConfig.map(m => m.c_data_from);
        //     console.log("Metrics Config:", checkMetrics);
        //  /** GROUP CONFIG PER TYPE */
        // const metricsMap = {};
        // metricsConfig.forEach(m => {
        //     const key = `${m.c_project}_${m.c_terminal_type}`;
        //     if (!metricsMap[key]) metricsMap[key] = [];
        //     metricsMap[key].push(m);
        // });

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
            if(row.c_terminal_sn === "611-077"){
                console.log("Debug Terminal 611-077:", row.n_status, monitoringMap.get(`${row.c_project}_${row.c_terminal_sn}`));
            }
            const mapKey = `${row.c_project}_${row.c_terminal_sn}`;
            const monitoring = monitoringMap.get(mapKey);
            //Jika akan mengecek Metrics aktifkan ini
            // const configKey = `${row.c_project}_${row.c_terminal_type}`;
            // const configs = metricsMap[configKey] || [];
            let matricsSend = [];

            let status = row.n_status ? normalize(row.n_status) : "NO_DATA";
            const interval = settings ? parseInt(settings.c_setting_value) : 5;
            const now = new Date();
            if(monitoring && monitoring.d_monitoring) {
            // console.log(`Processing terminal ${row.c_terminal_sn} at station ${row.n_station}`);
                const diffMinutes = (now - new Date(monitoring.d_monitoring)) / 1000 / 60;  
                if(diffMinutes > interval) {
                    status = "DANGER";
                    matricsSend.push({
                        status : "DOWN",
                        measure: "DOWN",
                        c_data_type: "NETWORK_USAGE",
                        notes: "No monitoring data within interval"
                    })
                } 
                const dataTypesForTerminal = dataTypes.filter(dt => dt.c_project === row.c_project && dt.c_terminal_type === row.c_terminal_type);
                for (const dataTypeMap of dataTypesForTerminal || []) {
                    const dataM = monitoring.data ? monitoring.data.find(d => d.c_data_type === dataTypeMap.c_data_type) : null;
                    if(dataM) {
                        if(dataM.status === "DANGER" || dataM.status === "WARNING") {
                            matricsSend.push({
                                status : dataM.status,
                                measure: dataM.measure,
                                c_data_type: dataM.c_data_type,
                                notes: dataM.notes || null
                            });
                            if(status === "DANGER") {
                                status = "DANGER"; 
                            } else if(status === "WARNING" && (dataM.status === "DANGER" || dataM.status === "WARNING")) {
                                status = dataM.status;
                            } else if(dataM.status !== "NO_DATA") {
                                status = dataM.status;
                            }
                            
                        }
                    }
                }
                //Jika akan mengecek Metrics aktifkan ini
                // for (const metric of configs) {
                //     if (metric.c_metrics_type === "network") {
                //         continue;
                //     }
                //     const found = monitoringData.find(
                //         m => m.c_data_type === metric.c_data_from
                //     );
                //     const statusM = normalize(found?.status);

                //     if (statusM === "DANGER") {
                //         status = "DANGER";
                //         matricsSend.push({
                //             status : found?.status || "DANGER",
                //             measure: found?.measure || "DANGER",
                //             c_data_type: metric.c_data_type,
                //             notes: found?.notes || null
                //         });
                //     } else if (statusM === "WARNING") {
                //         if(status !== "DANGER") status = "WARNING";
                //         matricsSend.push({
                //             status : found?.status || "WARNING",
                //             measure: found?.measure || "WARNING",
                //             c_data_type: metric.c_data_type,
                //             notes: found?.notes || null
                //         });
                //     }
                // }
            } 

            const terminalData = {
                n_terminal_name: row.n_terminal_name,
                c_terminal_sn: row.c_terminal_sn,
                n_lat: row.t_lat,
                n_lng: row.t_lng,
                d_monitoring: toJakartaTime(monitoring?.d_monitoring) || null,
                status,
                matrics : matricsSend
            };

            stationMap[key].terminal.push(terminalData);
        }

        /* ===============================
            4️⃣ CLASSIFY STATION
        =============================== */
        // console.log("4 Classifying stations...");
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
        console.error("Error in getMonitoringSummaryService:", err);
        return {
            code: "5000",
            message: "Failed to get monitoring summary",
            data: err
        };

    }
};