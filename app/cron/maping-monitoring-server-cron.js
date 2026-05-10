import cron from "node-cron";
import pLimit from "p-limit";

import db from "../config/database.js";
import dbserver from "../config/databaseServer.js";

/* =========================
    STATUS HELPER
========================= */
const getStatus = (value, dt) => {
    if (value === null || value === undefined) return "NO DATA";

    if (dt.l_danger_up !== null && value >= dt.l_danger_up) return "DANGER";
    if (dt.l_danger_down !== null && value <= dt.l_danger_down) return "DANGER";

    if (dt.l_warning_up !== null && value >= dt.l_warning_up) return "WARNING";
    if (dt.l_warning_down !== null && value <= dt.l_warning_down) return "WARNING";

    return "NORMAL";
};

/* =========================
    CRON LOCK
========================= */
let isRunning = false;

/* =========================
    MAIN CRON
========================= */
export const runServerMonitoringCron = async () => {

    cron.schedule("10 */3 * * * *", async () => {

        if (isRunning) {
            console.log("⚠️ monitoring cron still running, skipped");
            return;
        }

        isRunning = true;

        console.log("🚀 Running server monitoring cron:", new Date().toISOString());

        try {

            /* =========================
                1️⃣ LOAD MASTER DATA
            ========================== */

            const [terminals, dataTypes] = await Promise.all([

                db("master.t_m_terminal")
                    .where("c_terminal_type", "SERVERS")
                    .where("b_active", true)
                    .whereNull("d_deleted_at"),

                db("master.t_m_data_type")
                    .where("c_terminal_type", "SERVERS")
                    .where("b_active", true)

            ]);

            if (!terminals.length) {
                console.log("⚠️ no terminal found");
                return;
            }

            const now = new Date();

            /* =========================
                2️⃣ CACHE LATEST TIME
            ========================== */

            const latestTimeResult = await dbserver.raw(`
                SELECT MAX(time) AS max_time
                FROM public.prometheus
                WHERE time >= NOW() AT TIME ZONE 'UTC' - INTERVAL '10 minutes'
            `);

            const latestTime = latestTimeResult.rows?.[0]?.max_time;

            if (!latestTime) {
                console.log("⚠️ no prometheus data");
                return;
            }

            /* =========================
                3️⃣ CONCURRENCY LIMIT
            ========================== */

            const limit = pLimit(5);

            await Promise.all(
                terminals.map(terminal =>
                    limit(() =>
                        processTerminal({
                            terminal,
                            dataTypes,
                            latestTime,
                            now
                        })
                    )
                )
            );

            console.log("✅ Server monitoring cron executed");

        } catch (err) {

            console.error("❌ Server monitoring cron failed:", err);

        } finally {

            isRunning = false;

        }

    });

};

/* =========================
    PROCESS TERMINAL
========================= */
const processTerminal = async ({
    terminal,
    dataTypes,
    latestTime,
    now
}) => {

    try {

        const monitoringData = [];

        for (const dt of dataTypes) {

            let valResult = null;
            let notes = null;

            /* =========================
                DISK USAGE
            ========================== */
            if (dt.c_data_type === "disk_usage") {

                const result = await dbserver.raw(`
                    WITH disk_data AS (
                        SELECT
                            tags->>'mountpoint' AS mountpoint,
                            MAX((fields->>'node_filesystem_size_bytes')::numeric) AS size_bytes,
                            MAX((fields->>'node_filesystem_avail_bytes')::numeric) AS avail_bytes
                        FROM public.prometheus
                        WHERE tags->>'source' = ?
                        AND time = ?
                        AND tags->>'fstype' NOT IN ('tmpfs', 'overlay')
                        GROUP BY tags->>'mountpoint'
                    )
                    SELECT
                        mountpoint,
                        ROUND((size_bytes - avail_bytes) / 1024 / 1024 / 1024, 0) AS used_gb,
                        ROUND(size_bytes / 1024 / 1024 / 1024, 0) AS total_gb,
                        ROUND(((size_bytes - avail_bytes) / size_bytes) * 100, 2) AS usage_percent
                    FROM disk_data;
                `, [
                    terminal.c_terminal_02,
                    latestTime
                ]);

                const data = result.rows.map(row => {

                    const status = getStatus(row.usage_percent, dt);

                    return {
                        notes: `${row.used_gb}GB dari ${row.total_gb}GB`,
                        value: +Number(row.usage_percent).toFixed(2),
                        status,
                        measure: "%",
                        c_data_type: `disk_usage_${row.mountpoint.replace("/", "").toLowerCase() || "root"}`
                    };

                });

                monitoringData.push(...data);

                continue;
            }

            /* =========================
                POSTGRESQL UP
            ========================== */
            if (dt.c_data_type === "postgresql_up") {

                const result = await dbserver.raw(`
                    SELECT fields->>'postgresql_up' AS postgresql_up
                    FROM public.prometheus
                    WHERE time = ?
                    AND fields ? 'postgresql_up'
                    LIMIT 1
                `, [latestTime]);

                if (result.rows.length) {

                    valResult = Number(result.rows[0].postgresql_up);

                    monitoringData.push({
                        c_data_type: dt.c_data_type,
                        value: valResult,
                        measure: valResult === 1 ? "RUNNING" : "NOT RUNNING",
                        status: valResult === 1 ? "NORMAL" : "DANGER",
                        notes: valResult === 1 ? "RUNNING" : "NOT RUNNING"
                    });

                } else {

                    monitoringData.push({
                        c_data_type: dt.c_data_type,
                        value: null,
                        measure: "NO DATA",
                        status: "NO DATA",
                        notes: null
                    });

                }

                continue;
            }

            /* =========================
                CPU USAGE
            ========================== */
            if (dt.c_data_type === "cpu_usage") {

                const result = await dbserver.raw(`
                    WITH base AS (
                        SELECT
                            time,
                            tags->>'cpu' AS cpu,
                            (fields->>'node_cpu_seconds_total')::double precision AS value
                        FROM public.prometheus
                        WHERE tags->>'mode' = 'idle'
                        AND tags->>'source' = ?
                        AND time >= NOW() AT TIME ZONE 'UTC' - INTERVAL '6 minutes'
                    ),
                    calc AS (
                        SELECT
                            value - LAG(value) OVER (
                                PARTITION BY cpu
                                ORDER BY time
                            ) AS delta_value,

                            EXTRACT(EPOCH FROM (
                                time - LAG(time) OVER (
                                    PARTITION BY cpu
                                    ORDER BY time
                                )
                            )) AS delta_time
                        FROM base
                    )
                    SELECT
                        ROUND(
                            100 - (
                                AVG(
                                    CASE
                                        WHEN delta_value >= 0
                                        AND delta_time > 0
                                        THEN delta_value / delta_time
                                    END
                                ) * 100
                            ),
                            2
                        ) AS cpu_usage
                    FROM calc;
                `, [terminal.c_terminal_02]);

                valResult = result.rows?.[0]?.cpu_usage || null;
            }

            /* =========================
                MEMORY USAGE
            ========================== */
            if (dt.c_data_type === "memory_usage") {

                const result = await dbserver.raw(`
                    SELECT
                        (
                            MAX(
                                CASE
                                    WHEN fields ? 'node_memory_MemTotal_bytes'
                                    THEN (fields->>'node_memory_MemTotal_bytes')::numeric
                                END
                            )
                            -
                            MAX(
                                CASE
                                    WHEN fields ? 'node_memory_MemAvailable_bytes'
                                    THEN (fields->>'node_memory_MemAvailable_bytes')::numeric
                                END
                            )
                        ) / 1024 / 1024 / 1024 AS memory_usage_gb
                    FROM public.prometheus
                    WHERE tags->>'source' = ?
                    AND time = ?
                `, [
                    terminal.c_terminal_02,
                    latestTime
                ]);

                valResult = result.rows?.[0]?.memory_usage_gb || null;
            }

            const status = getStatus(valResult, dt);

            monitoringData.push({
                c_data_type: dt.c_data_type,
                value: valResult ? +Number(valResult).toFixed(2) : null,
                measure: dt.n_measure,
                status,
                notes
            });

        }

        /* =========================
            GLOBAL STATUS
        ========================== */

        let n_status = "NORMAL";

        if (monitoringData.some(d => d.status === "DANGER")) {
            n_status = "DANGER";
        } else if (monitoringData.some(d => d.status === "WARNING")) {
            n_status = "WARNING";
        }

        /* =========================
            INSERT / UPDATE
        ========================== */

        await db.transaction(async trx => {

            const existingRows = await trx("opr.t_d_monitoring_device")
                .select("i_id", "d_monitoring")
                .where({
                    c_project: terminal.c_project,
                    c_terminal_sn: terminal.c_terminal_sn,
                    c_station: terminal.c_station
                })
                .orderBy("d_monitoring", "asc");

            /* =========================
                INSERT BARU
            ========================== */

            if (existingRows.length < 10) {

                await trx("opr.t_d_monitoring_device")
                    .insert({
                        c_project: terminal.c_project,
                        c_terminal_sn: terminal.c_terminal_sn,
                        c_station: terminal.c_station,
                        d_monitoring: now,
                        n_status,
                        data: trx.raw("?::jsonb", [
                            JSON.stringify(monitoringData)
                        ])
                    });

                return;
            }

            /* =========================
                UPDATE DATA PALING LAMA
            ========================== */

            const oldest = existingRows[0];

            await trx("opr.t_d_monitoring_device")
                .where({
                    i_id: oldest.i_id
                })
                .update({
                    d_monitoring: now,
                    n_status,
                    data: trx.raw("?::jsonb", [
                        JSON.stringify(monitoringData)
                    ])
                });

        });

    } catch (err) {

        console.error(`❌ terminal ${terminal.c_terminal_02} failed`, err);

    }

};