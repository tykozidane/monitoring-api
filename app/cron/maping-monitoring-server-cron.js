import cron from "node-cron";
import pLimit from "p-limit";

import db from "../config/database.js";
import dbserver from "../config/databaseServer.js";

/* =========================================================
    CONFIG
========================================================= */

const TERMINAL_CONCURRENCY = 5;
const limit = pLimit(TERMINAL_CONCURRENCY);

/* =========================================================
    LOCK CRON
========================================================= */

let isRunning = false;

/* =========================================================
   STATUS HELPER
========================================================= */

const getStatus = (value, dt) => {

    if (value === null || value === undefined) {
        return "NO DATA";
    }

    if (
        dt.l_danger_up !== null &&
        value >= dt.l_danger_up
    ) {
        return "DANGER";
    }

    if (
        dt.l_danger_down !== null &&
        value <= dt.l_danger_down
    ) {
        return "DANGER";
    }

    if (
        dt.l_warning_up !== null &&
        value >= dt.l_warning_up
    ) {
        return "WARNING";
    }

    if (
        dt.l_warning_down !== null &&
        value <= dt.l_warning_down
    ) {
        return "WARNING";
    }

    return "NORMAL";
};

/* =========================================================
    GET CURRENT MINUTE UTC
========================================================= */

const getCurrentMinuteUTC = () => {

    const now = new Date();

    now.setSeconds(0);
    now.setMilliseconds(0);

    return now.toISOString();
};

/* =========================================================
    PROCESS METRIC
========================================================= */

const processMetric = async (terminal, dt) => {

    try {

        /* =================================================
            CPU USAGE
        ================================================= */

        if (dt.c_data_type === "cpu_usage") {

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
                    if (result && result.rows.length > 0) {
                        return [{
                            c_data_type: dt.c_data_type,
                            value: Number(result.rows[0].cpu_usage).toFixed(2) || null,
                            measure: dt.n_measure,
                            status : "NORMAL", 
                            notes: null
                        }];
                    } else {
                        return [{
                            c_data_type: dt.c_data_type,
                            value: null,
                            measure: 'NO DATA',
                            status : 'NO DATA', 
                            notes: null
                        }];
                    }
        }

        /* =================================================
            MEMORY USAGE
        ================================================= */

        if (dt.c_data_type === "memory_usage") {

            const result = await dbserver.raw(`
                        WITH latest_time AS (
                            SELECT MAX("time") AS max_time
                            FROM public.prometheus
                            WHERE tags->>'source' = '${terminal.c_terminal_02}'
                            AND (fields \\? 'node_memory_MemTotal_bytes' OR fields \\? 'node_memory_MemAvailable_bytes')
                            AND time >= NOW() AT TIME ZONE 'UTC'  - INTERVAL '6 minutes'
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
                    if (result && result.rows.length > 0) {
                        return [{
                            c_data_type: dt.c_data_type,
                            value: Number(result.rows[0].memory_usage_gb).toFixed(2) || null,
                            measure: dt.n_measure,
                            status : "NORMAL", 
                            notes: null
                        }];
                    } else {
                        return [{
                            c_data_type: dt.c_data_type,
                            value: null,
                            measure: 'NO DATA',
                            status : 'NO DATA', 
                            notes: null
                        }];
                    }
        }

        /* =================================================
            POSTGRESQL
        ================================================= */

        if (dt.c_data_type === "postgresql_up") {

            const result = await dbserver.raw(`
                        SELECT
                            time,
                            fields->>'postgresql_up' AS postgresql_up
                        FROM public.prometheus
                        WHERE time = date_trunc('minute', NOW() AT TIME ZONE 'UTC')
                        AND fields \\? 'postgresql_up'
                        LIMIT 1;
                        `)
                    if (result && result.rows.length > 0) {
                        const postgresqlUp = result.rows[0].postgresql_up;
                        return [{
                            c_data_type: dt.c_data_type,
                            value: Number(postgresqlUp) || null,
                            measure: postgresqlUp === '1' ? 'RUNNING' : 'NOT RUNNING',
                            status : postgresqlUp === '1' ? 'NORMAL' : 'DANGER', // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                            notes: postgresqlUp === '1' ? 'RUNNING' : 'NOT RUNNING'
                        }];
                    } else {
                        return [{
                            c_data_type: dt.c_data_type,
                            value: null,
                            measure: 'NO DATA',
                            status : 'NO DATA', // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                            notes: null
                        }];
                    }
        }

        /* =================================================
            DISK
        ================================================= */

        if (dt.c_collect_type === "disk_usage") {

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
                        if (result.rows.length > 0) {
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
                        return data;
                    } else {
                        return [{
                            c_data_type: dt.c_data_type,
                            value: null,
                            measure: 'NO DATA',
                            status : 'NO DATA', // 🔥 sementara hardcode, nanti sesuaikan dengan getStatus
                            notes: null
                        }];
                    }
        }

        return [];

    } catch (err) {

        console.error(
            `Metric error ${terminal.c_terminal_sn} ${dt.c_data_type}`,
            err.message
        );

        return [{
            c_data_type: dt.c_data_type,
            value: null,
            measure: "ERROR",
            status: "DANGER",
            notes: err.message
        }];
    }
};

/* =========================================================
    PROCESS TERMINAL
========================================================= */

const processTerminal = async (
    terminal,
    dataTypes,
    monitoringTime
) => {

    try {

        const monitoringData = [];

        for (const dt of dataTypes) {

            const metricData =
                await processMetric(
                    terminal,
                    dt
                );

            monitoringData.push(...metricData);
        }

        /* =================================================
            GLOBAL STATUS
        ================================================= */

        let n_status = "NORMAL";

        if (
            monitoringData.some(
                d => d.status === "DANGER"
            )
        ) {
            n_status = "DANGER";
        }
        else if (
            monitoringData.some(
                d => d.status === "WARNING"
            )
        ) {
            n_status = "WARNING";
        }

        /* =================================================
            INSERT
        ================================================= */

        await db("opr.t_d_monitoring_device")
            .insert({
                c_project: terminal.c_project,
                c_terminal_sn: terminal.c_terminal_sn,
                c_station: terminal.c_station,
                d_monitoring: monitoringTime,
                n_status,
                data: db.raw(
                    "?::jsonb",
                    [JSON.stringify(monitoringData)]
                )
            });

    } catch (err) {

        console.error(
            `Terminal error ${terminal.c_terminal_sn}`,
            err
        );
    }
};

/* =========================================================
    MAIN PROCESS
========================================================= */

export const runServerMonitoringCron = async () => {

    if (isRunning) {

        console.log(
            "⚠️ Previous cron still running, skipping..."
        );

        return;
    }

    isRunning = true;
    console.log(
            "🚀 Running MAPPING SERVER MONITORING CRON:",
            new Date().toISOString()
        );
    try {

        

        /* =================================================
            GET TERMINALS
        ================================================= */

        const terminals = await db("master.t_m_terminal")
            .where("c_terminal_type", "SERVERS")
            .where("b_active", true)
            .whereNotNull("c_terminal_sn")
            .whereNotNull("c_terminal_02")
            .whereNull("d_deleted_at");

        if (!terminals.length) {

            console.log(
                "⚠️ No server terminal found"
            );

            return;
        }

        /* =================================================
            GET DATA TYPES
        ================================================= */

        const dataTypes = await db("master.t_m_data_type")
            .where("c_terminal_type", "SERVERS")
            .where("b_active", true);

        const monitoringTime =
            getCurrentMinuteUTC();

        /* =================================================
            PROCESS TERMINALS
        ================================================= */

        await Promise.all(
            terminals.map(terminal =>
                limit(() =>
                    processTerminal(
                        terminal,
                        dataTypes,
                        monitoringTime
                    )
                )
            )
        );

        console.log(
            `✅ Server monitoring done: ${terminals.length} terminals`
        );

    } catch (err) {

        console.error(
            "❌ Server monitoring cron failed:",
            err
        );

    } finally {

        isRunning = false;
    }
};

/* =========================================================
    CRON SCHEDULER
========================================================= */

/*
    every minute at second 30

    example:
    10:00:30
    10:01:30
    10:02:30
*/

cron.schedule(
    "10 * * * * *",
    async () => {

        await runServerMonitoringCron();
    },
    {
        timezone: "Asia/Jakarta"
    }
);

console.log(
    "🕒 Server monitoring cron scheduler started"
);