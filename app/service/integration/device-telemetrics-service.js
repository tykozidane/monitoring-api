import db from "../../config/database.js";

export const getDeviceTelemetrics = async (c_project, serial_number) => {
    try {

        /** 1️⃣ Get terminal */
        const terminal = await db("master.t_m_terminal")
        .where({
            c_project,
            c_terminal_sn: serial_number,
            b_active: true
        })
        .first();

        if (!terminal) {
        return { code: "404", message: "Terminal not found" };
        }

        /** 2️⃣ Get metrics config */
        const metricsConfig = await db("config.t_m_terminal_metrics")
        .where({
            c_project,
            c_terminal_type: terminal.c_terminal_type,
            b_active: true
        });

        /** 3️⃣ Get last monitoring */
        const monitoring = await db("opr.t_d_monitoring_device")
        .where({
            c_project,
            c_terminal_sn: serial_number
        })
        .orderBy("d_monitoring", "desc")
        .first();

        let monitoringData = [];
        let lastMonitoringTime = null;

        if (monitoring) {
        monitoringData = monitoring.data || [];
        lastMonitoringTime = new Date(monitoring.d_monitoring);
        }

        /** 4️⃣ Get network check interval */
        const setting = await db("master.t_m_setting")
        .where({
            c_project,
            c_setting_key: "terminal_network_check_interval",
            b_active: true
        })
        .first();

        const networkIntervalMinutes = setting
        ? parseInt(setting.c_setting_value)
        : 5;

        const now = new Date();

        /** 5️⃣ Build metrics response */
        const metrics = metricsConfig.map(metric => {

        // NETWORK special handling
        if (metric.c_metrics_type === "network") {
            let status = "UP";

            if (!lastMonitoringTime ||
            (now - lastMonitoringTime) > (networkIntervalMinutes * 60 * 1000)
            ) {
            status = "DOWN";
            }

            return {
            value: status === "UP" ? 0 : 1,
            status,
            measure: status,
            c_data_type: metric.c_data_type,
            notes: null
            };
        }

        // find matching metric from monitoring.data
        const found = monitoringData.find(
            m => m.c_data_type === metric.c_data_from
        );

        return {
            value: found?.value ?? null,
            status: found?.status ?? "NO_DATA",
            measure: found?.measure ?? null,
            c_data_type: metric.c_data_type,
            notes: found?.notes ?? null
        };
        });

        return {
        code: 0,
        message: {
            item_serial_code: terminal.c_item_serial_code,
            serial_number,
            model_code: terminal.c_model_code,
            model_name: terminal.c_model_name,
            last_updated: new Date(
    new Date(lastMonitoringTime).toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
    })) || null,
            metrics
        }
        };

    } catch (err) {
        return {
        code: "500",
        message: "Failed to get telemetrics",
        data: err
        };
    }
};
