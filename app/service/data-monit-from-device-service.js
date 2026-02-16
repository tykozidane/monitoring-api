import db from "../config/database.js";
import { indexMonitoringData } from "../service/elastic-service.js";

/**
 * Tentukan status berdasarkan threshold
 */
const getStatus = (value, dt) => {
    if (dt.l_danger_up !== null && value >= dt.l_danger_up) return "danger";
    if (dt.l_danger_down !== null && value <= dt.l_danger_down) return "danger";

    if (dt.l_warning_up !== null && value >= dt.l_warning_up) return "warning";
    if (dt.l_warning_down !== null && value <= dt.l_warning_down) return "warning";

    return "normal";
};

const getStatusUpOnly = (value, dt) => {
    if (dt.l_danger_up !== null && value >= dt.l_danger_up) return "danger";
    if (dt.l_warning_up !== null && value >= dt.l_warning_up) return "warning";
    return "normal";
};


/**
 * Validasi timestamp device vs waktu server
 * @param {number} deviceTimestamp - unix timestamp (detik)
 * @param {number} toleranceSec - toleransi selisih (detik), default 300 detik (5 menit)
 * @returns {Date} waktu final yang dipakai untuk DB
 */
export const resolveMonitoringTime = (
    deviceTimestamp,
    toleranceSec = 300
) => {
    const serverTimeMs = Date.now();
    const serverTimeSec = Math.floor(serverTimeMs / 1000);

    // jika timestamp tidak valid
    if (
        !deviceTimestamp ||
        typeof deviceTimestamp !== "number" ||
        deviceTimestamp <= 0
    ) {
        return new Date(serverTimeMs);
    }

    const diff = Math.abs(deviceTimestamp - serverTimeSec);

    // jika selisih terlalu jauh
    if (diff > toleranceSec) {
        return new Date(serverTimeMs);
    }

    // timestamp valid
    return new Date(deviceTimestamp * 1000);
};

/**
 * Menentukan status keseluruhan dari data & devices
 * @param {Array} dataArr - array data monitoring [{ status }]
 * @param {Array} deviceArr - array device monitoring [{ status }]
 * @returns {string} normal | warning | danger
 */
const STATUS_PRIORITY = {
    normal: 1,
    warning: 2,
    danger: 3
};

export const resolveOverallStatus = (dataArr = [], deviceArr = []) => {
    let maxPriority = STATUS_PRIORITY.normal;

    const checkStatus = (status) => {
        if (!STATUS_PRIORITY[status]) return;
        maxPriority = Math.max(maxPriority, STATUS_PRIORITY[status]);
    };

    for (const d of dataArr) {
        checkStatus(d.status);
    }

    for (const dev of deviceArr) {
        // data_not_found dianggap warning (opsional, bisa kamu ubah)
        const status = dev.status === "data_not_found" ? "warning" : dev.status;
        checkStatus(status);
    }

    return Object.keys(STATUS_PRIORITY)
        .find(key => STATUS_PRIORITY[key] === maxPriority);
};


export const saveMonitoringGateService = async (payload) => {
    const trx = await db.transaction();

    try {
        const {
            c_terminal_sn,
            c_terminal_01,
            c_terminal_02,
            c_project,
            c_station,
            timestamp,
            ...body
        } = payload;

        /* =========================
            1. CEK TERMINAL
        ========================== */
        const terminal = await trx("master.t_m_terminal")
            .where({
                c_project,
                c_station,
                c_terminal_sn,
                b_active: true,
                d_deleted_at: null
            })
            .first();

        if (!terminal) {
            throw {
                code: "1404",
                message: "Terminal tidak terdaftar"
            };
        }

        /* =========================
            2. AMBIL DATA TYPE
        ========================== */
        const dataTypes = await trx("master.t_m_data_type")
            .where({
                c_project,
                b_active: true,
                d_deleted_at: null
            });

/* =========================
    3. BENTUK DATA (jsonb)
========================= */
const monitoringData = [];

/* Ambil setting notes_disk */
const diskSetting = await trx("master.t_m_setting")
    .where({
        c_project,
        c_setting_key: "notes_disk",
        b_active: true
    })
    .first();

const diskNoteTemplate = diskSetting?.c_setting_value || "(usage) dari (total)";

for (const dt of dataTypes) {

    /* =========================
        SYSTEM
    ========================== */
    if (dt.c_collect_type === "system") {

        const value = body[dt.c_data_type];
        if (value === undefined) {
            monitoringData.push({
                c_data_type: dt.c_data_type,
                value: 0,
                measure: dt.n_measure || "",
                status: "no_data",
                notes: "Data tidak ditemukan pada request body"
            });
            continue;
        };

        monitoringData.push({
            c_data_type: dt.c_data_type,
            value,
            measure: dt.n_measure || "",
            status: getStatus(value, dt),
            notes: null
        });
    }

    /* =========================
        APPLICATION
    ========================== */
    if (dt.c_collect_type === "application") {
        console.log("Processing application data type:", dt.c_data_type);
        const direction = parseInt(dt.n_measure);
        const found = body.app?.find(a => a.direction === direction);

        if (!found) continue;

        const status = found.status < 0 ? "danger" : "normal";
        const measure = found.status < 0 ? "NOT RUNNING" : "RUNNING";

        monitoringData.push({
            c_data_type: dt.c_data_type,
            value: 0,
            measure,
            status,
            notes: found.description || null
        });
    }

    /* =========================
        DISK
    ========================== */
    if (dt.c_collect_type === "disk") {
        console.log("Processing disk data type:", dt.c_data_type);
        const drive = dt.n_measure; // C / D
        const found = body.disk?.find(d => d.drive === drive);

        if (!found) continue;

        const value = found.usage_percentage;
        const status = getStatusUpOnly(value, dt);

        const notes = diskNoteTemplate
            .replace("(usage)", found.usage)
            .replace("(total)", found.total);

        monitoringData.push({
            c_data_type: dt.c_data_type,
            value,
            measure: "%",
            status,
            notes
        });
    }

    /* =========================
        COUNTER  
    ========================== */
    if (dt.c_collect_type === "counter") {

        if (!Array.isArray(body.counter)) continue;

        body.counter.forEach((val, index) => {

            const status = getStatusUpOnly(val, dt);

            monitoringData.push({
                c_data_type: `COUNTER_${index + 1}`,
                value: val,
                measure: "count",
                status,
                notes: null
            });
        });
    }
}
    // console.log("Monitoring Data:", monitoringData);
        /* =========================
            4. BENTUK DEVICES (jsonb) - DINAMIS
            ========================== */

            // ambil semua device yang terdaftar untuk terminal ini
            const masterDevices = await trx("master.t_m_device")
                .where({
                    c_project,
                    c_terminal_sn: terminal.c_terminal_sn,
                    b_active: true,
                    d_deleted_at: null
                });

            const devices = [];

            for (const md of masterDevices) {
                const bodyDevice = body[md.c_device];

                // jika device tidak ada di body
                if (!bodyDevice) {
                    devices.push({
                        c_device: md.c_device,
                        c_serial_number: md.c_serial_number,
                        c_device_type: md.c_device_type,
                        c_direction: md.c_direction,
                        status: "data_not_found"
                    });
                    continue;
                }

                // jika device ada di body
                devices.push({
                    c_device: md.c_device,
                    c_serial_number: bodyDevice.serialnumber || md.c_serial_number || "",
                    c_device_type: md.c_device_type,
                    c_direction: bodyDevice.direction ?? md.c_direction ?? null,
                    status: bodyDevice.status === 0 ? "normal" : "error"
                });
            }

        /* =========================
            5. INSERT MONITORING
        ========================== */
        // hitung total data monitoring
        const total = await trx("opr.t_d_monitoring_device")
            .where({ c_project, c_terminal_sn: terminal.c_terminal_sn, c_station })
            .count("i_id as total")
            .first();

        //Check Timestamp Validity (max 1 minutes tolerance)
        const monitoringTime = resolveMonitoringTime(timestamp);
        
        //Check Overall Status
        const n_status = resolveOverallStatus(monitoringData, devices);
        const elasticDoc = {
                c_project,
                c_station,
                c_terminal: terminal.c_terminal_01,
                c_terminal_sn: terminal.c_terminal_sn,
                c_terminal_type: terminal.c_terminal_type,
                n_status,
                d_monitoring: monitoringTime.toISOString(),
                data: monitoringData,
                devices: devices,
                raw_data: payload   // opsional, bisa dihapus kalau berat
            };
        if (Number(total.total) < 10) {

            /* =========================
            INSERT BARU
            ========================== */
            await trx("opr.t_d_monitoring_device").insert({
                c_project,
                c_terminal_sn: terminal.c_terminal_sn,
                c_station,
                d_monitoring: monitoringTime.toISOString(),
                n_status,
                data: trx.raw("?::jsonb", [JSON.stringify(monitoringData)]),
                devices: trx.raw("?::jsonb", [JSON.stringify(devices)]),
                raw_data: trx.raw("?::jsonb", [JSON.stringify(payload)])
            });

        } else {

            /* =========================
            UPDATE DATA PALING LAMA
            ========================== */
            const oldest = await trx("opr.t_d_monitoring_device")
                .where({ c_project, c_terminal_sn: terminal.c_terminal_sn, c_station })
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
                    d_monitoring: monitoringTime.toISOString(),
                    n_status,
                    data: trx.raw("?::jsonb", [JSON.stringify(monitoringData)]),
                    devices: trx.raw("?::jsonb", [JSON.stringify(devices)]),
                    raw_data: trx.raw("?::jsonb", [JSON.stringify(payload)])
                });
            }
        await trx.commit();
        // console.log("Before elasticDoc:", elasticDoc);
        // setelah trx.commit()
        // const elasticResult = await indexMonitoringData(elasticDoc);
        // console.log("Elastic result:", elasticResult);
        
        return { code: 0, message: "Monitoring gate berhasil disimpan" };

    } catch (err) {
        await trx.rollback();
        return {
            code: err.code || "1500",
            message: err.message || "Database error",
            data: err
        };
    }
};
