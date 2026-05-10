import dbserver from "../config/databaseServer.js";
import db from "../config/database.js";
import cron from "node-cron";
/* =========================
    STATUS HELPER
========================= */
const getStatus = (value, dt) => {
    if (dt.l_danger_up !== null && value >= dt.l_danger_up) return "DANGER";
    if (dt.l_danger_down !== null && value <= dt.l_danger_down) return "DANGER";

    if (dt.l_warning_up !== null && value >= dt.l_warning_up) return "WARNING";
    if (dt.l_warning_down !== null && value <= dt.l_warning_down) return "WARNING";

    return "NORMAL";
};


/* =========================
    CRON MAIN
========================= */
export const runServerMonitoringCron = async () => {
    cron.schedule("10 */3 * * * *", async () => {
        console.log("Running server monitoring cron:", new Date().toISOString());
    const trx = await db.transaction();
    
    try {

        /* =========================
            1️⃣ GET TERMINAL SERVERS
        ========================== */
        const terminals = await trx("master.t_m_terminal")
            .where("c_terminal_type", "SERVERS")
            .where("b_active", true)
            .whereNull("d_deleted_at");

        if (!terminals.length) return;

        /* =========================
            2️⃣ GET DATA TYPE SERVERS
        ========================== */
        const dataTypes = await trx("master.t_m_data_type")
            .where("c_terminal_type", "SERVERS")
            .where("b_active", true);

        const now = new Date();

        /* =========================
            3️⃣ LOOP TERMINAL
        ========================== */
        for (const terminal of terminals) {
            console.log(`Collecting data for terminal: ${terminal.c_terminal_sn} - ${terminal.c_terminal_02}`);
            const monitoringData = [];

            /* =========================
                LOOP DATA TYPE
            ========================== */
            for (const dt of dataTypes) {

                // const collector = collectors[dt.c_data_type];
                let valResult = 0;
                let notes = null;
                // console.log(`Collecting ${dt.c_data_type} `);
                // if (!collector) continue; // skip kalau belum ada logic

                if(dt.c_data_type === "disk_usage") {
                    const result = await dbserver.raw(`
                        WITH latest_time AS (
                            SELECT MAX(time) AS max_time
                            FROM public.prometheus
                            WHERE tags->>'source' = '${terminal.c_terminal_02}'
                            AND time >= date_trunc('minute', NOW() AT TIME ZONE 'UTC')
                            AND time < date_trunc('minute', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 minute'
                        ),
                        disk_data AS (
                            SELECT
                                tags->>'mountpoint' AS mountpoint,
                                MAX((fields->>'node_filesystem_size_bytes')::numeric) AS size_bytes,
                                MAX((fields->>'node_filesystem_avail_bytes')::numeric) AS avail_bytes
                            FROM public.prometheus p
                            JOIN latest_time lt ON p.time = lt.max_time
                            WHERE tags->>'source' = '${terminal.c_terminal_02}'
                            AND tags->>'fstype' NOT IN ('tmpfs', 'overlay')
                            GROUP BY tags->>'mountpoint'
                        )
                        SELECT
                            mountpoint,
                            ROUND((size_bytes - avail_bytes) / 1024 / 1024 / 1024, 0) AS used_gb,
                            ROUND(size_bytes / 1024 / 1024 / 1024, 0) AS total_gb,
                            ROUND(((size_bytes - avail_bytes) / size_bytes) * 100, 2) AS usage_percent
                        FROM disk_data;
                        `)
                        if (result.rows.length) {
                        const data = result.rows.map(row => {
                            const status = getStatus(row.usage_percent, dt);
                            return {
                                notes: `${row.used_gb}GB dari ${row.total_gb}GB`,
                                value: +Number(row.usage_percent).toFixed(2),
                                status: status,
                                measure: '%',
                                c_data_type: `disk_usage_${row.mountpoint.replace('/', '').toLowerCase() || 'root'}`
                            };
                            });
                        monitoringData.push(...data);
                    } else {
                        valResult = null;
                        monitoringData.push({
                            c_data_type: dt.c_data_type,
                            value: null,
                            measure: 'NO DATA',
                            status : 'NO DATA', // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                            notes: null
                        });
                    }
                        
                        continue; // skip ke loop data type berikutnya karena sudah masukin semua disk
                } else if(dt.c_data_type === "postgresql_up") {
                    const result = await dbserver.raw(`
                        SELECT
                            time,
                            fields->>'postgresql_up' AS postgresql_up
                        FROM public.prometheus
                        WHERE time = date_trunc('minute', NOW() AT TIME ZONE 'UTC')
                        AND fields \\? 'postgresql_up'
                        LIMIT 1;
                        `)
                    if (result.rows.length) {
                        valResult = result.rows[0].postgresql_up;
                        monitoringData.push({
                            c_data_type: dt.c_data_type,
                            value: Number(valResult) || null,
                            measure: valResult === '1' ? 'RUNNING' : 'NOT RUNNING',
                            status : valResult === '1' ? 'NORMAL' : 'DANGER', // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                            notes: valResult === '1' ? 'RUNNING' : 'NOT RUNNING'
                        });
                    } else {
                        valResult = null;
                        monitoringData.push({
                            c_data_type: dt.c_data_type,
                            value: null,
                            measure: 'NO DATA',
                            status : 'NO DATA', // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                            notes: null
                        });
                    }
                    continue; // skip ke loop data type berikutnya karena sudah masukin data postgresql_up
                } else if(dt.c_data_type === "cpu_usage") {
                    const result = await dbserver.raw(`WITH base AS (
                        SELECT
                            time,
                            tags->>'source' AS source,
                            tags->>'cpu' AS cpu,
                            (fields->>'node_cpu_seconds_total')::double precision AS value
                        FROM public.prometheus
                        WHERE tags->>'mode' = 'idle'
                        AND tags->>'source' = '${terminal.c_terminal_02}'
                        AND time >= NOW() AT TIME ZONE 'UTC'  - INTERVAL '6 minutes'
                    ),
                    calc AS (
                        SELECT
                            time,
                            source,
                            cpu,
                            value,
                            value - LAG(value) OVER (
                                PARTITION BY source, cpu
                                ORDER BY time
                            ) AS delta_value,
                            EXTRACT(EPOCH FROM (
                                time - LAG(time) OVER (
                                    PARTITION BY source, cpu
                                    ORDER BY time
                                )
                            )) AS delta_time
                        FROM base
                    ),
                    rate_per_cpu AS (
                        SELECT
                            time,
                            source,
                            cpu,
                            CASE 
                                WHEN delta_value >= 0 AND delta_time > 0
                                THEN delta_value / delta_time
                                ELSE NULL
                            END AS rate
                        FROM calc
                    ),
                    final AS (
                        SELECT
                            time,
                            source,
                            100 - (AVG(rate) * 100) AS cpu_usage
                        FROM rate_per_cpu
                        WHERE rate IS NOT NULL
                        GROUP BY time, source
                    )
                    SELECT *
                    FROM final
                    ORDER BY time desc 
                    limit 1;`);
                    if (result.rows.length) {
                        valResult = result.rows[0].cpu_usage;
                    } else {
                        valResult = null;
                    }
                }else if(dt.c_data_type === "memory_usage") {
                    const result = await dbserver.raw(`
                        WITH latest_time AS (
                            SELECT MAX("time") AS max_time
                            FROM public.prometheus
                            WHERE tags->>'source' = '${terminal.c_terminal_02}'
                            AND (fields \\? 'node_memory_MemTotal_bytes' OR fields \\? 'node_memory_MemAvailable_bytes')
                        ),
                        memory_data AS (
                            SELECT 
                                p.tags->>'source' AS metric_source,
                                MAX(CASE 
                                    WHEN p.fields \\? 'node_memory_MemTotal_bytes' 
                                    THEN (p.fields->>'node_memory_MemTotal_bytes')::numeric 
                                END) AS mem_total_bytes,
                                MAX(CASE 
                                    WHEN p.fields \\? 'node_memory_MemAvailable_bytes' 
                                    THEN (p.fields->>'node_memory_MemAvailable_bytes')::numeric 
                                END) AS mem_available_bytes

                            FROM 
                                public.prometheus p
                            INNER JOIN 
                                latest_time lt ON p."time" = lt.max_time
                            WHERE 
                                p.tags->>'source' = '${terminal.c_terminal_02}'
                            GROUP BY 
                                p.tags->>'source'
                        )
                        SELECT 
                            metric_source AS source,
                            (mem_total_bytes - mem_available_bytes) / 1024 / 1024 / 1024 AS memory_usage_gb
                        FROM 
                            memory_data;
                        `);
                    if (result.rows.length) {
                        valResult = result.rows[0].memory_usage_gb;
                    } else {
                        valResult = null;
                    }
                }

                const status = getStatus(valResult, dt);

                monitoringData.push({
                    c_data_type: dt.c_data_type,
                    value: +Number(valResult).toFixed(2) || null,
                    measure: dt.n_measure,
                    status : "NORMAL", // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                    notes: notes
                });
            }

            /* =========================
                4️⃣ HITUNG STATUS GLOBAL
            ========================== */
            let n_status = "NORMAL";

            if (monitoringData.some(d => d.status === "DANGER")) {
                n_status = "DANGER";
            } else if (monitoringData.some(d => d.status === "WARNING")) {
                n_status = "WARNING";
            }
            
            /* =========================
                5️⃣ INSERT MONITORING
            ========================== */
            // hitung total data monitoring
            const total = await trx("opr.t_d_monitoring_device")
                .where({ c_project : terminal.c_project, c_terminal_sn: terminal.c_terminal_sn, c_station: terminal.c_station })
                .count("i_id as total")
                .first();
            if (Number(total.total) < 10) {
                console.log(`Inserting new monitoring data for terminal: ${terminal.c_terminal_sn} - ${terminal.c_terminal_02}`);
            /* =========================
            INSERT BARU
            ========================== */
            await trx("opr.t_d_monitoring_device").insert({
                c_project : terminal.c_project,
                c_terminal_sn: terminal.c_terminal_sn,
                c_station: terminal.c_station,
                d_monitoring: now,
                n_status: n_status,
                data: trx.raw("?::jsonb", [JSON.stringify(monitoringData)])
            });

        } else {

            /* =========================
            UPDATE DATA PALING LAMA
            ========================== */
            const oldest = await trx("opr.t_d_monitoring_device")
                .where({ c_project: terminal.c_project, c_terminal_sn: terminal.c_terminal_sn, c_station: terminal.c_station })
                .orderBy("d_monitoring", "asc")   // 👈 PALING LAMA
                .first();

            if (!oldest) {
                throw {
                    code: "1502",
                    message: "Data monitoring lama tidak ditemukan"
                };
            }
            

            await trx("opr.t_d_monitoring_device")
                .where({ i_id: oldest.i_id })
                .update({
                    d_monitoring: now,
                    n_status : n_status,
                    data: trx.raw("?::jsonb", [JSON.stringify(monitoringData)])
                });
            }
        }

        await trx.commit();

        console.log("✅ Server monitoring cron executed");

    } catch (err) {
        await trx.rollback();
        console.error("❌ Server monitoring cron failed:", err);
    }
    });

};