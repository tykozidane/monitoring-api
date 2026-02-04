import db from '../../config/database.js';

export const getAllTerminalLatestMonitoringAllStationServiceByProject = async ({
    c_project
}) => {
    try {
        if (!c_project) {
            return {
                code: "VALIDATION_ERROR",
                message: "c_project is required"
            };
        }

        /**
         * DISTINCT ON = ambil 1 data TERBARU per terminal
         */
        const result = await db.raw(`
            SELECT DISTINCT ON (md.c_terminal_sn)
                md.c_project,
                md.c_station,
                md.c_terminal_sn,
                t.c_terminal_sn,
                t.c_terminal_type,
                md.n_status,
                md.d_monitoring,
                md.data,
                md.devices
            FROM opr.t_d_monitoring_device md
            JOIN master.t_m_terminal t
                ON t.c_terminal_sn = md.c_terminal_sn
                AND t.c_project = md.c_project
                AND t.b_active = true
                AND t.d_deleted_at IS NULL
            WHERE md.c_project = ?
            ORDER BY md.c_terminal_sn, md.d_monitoring DESC
        `, [c_project]);

        return {
            code: 0,
            data: result.rows
        };

    } catch (err) {
        return {
            code: "1500",
            message: "Failed to fetch monitoring data",
            data: err
        }; 
    }
};

export const getAllTerminalLatestMonitoringAllStationService = async () => {
    try {

        /**
         * DISTINCT ON = ambil 1 data TERBARU per terminal
         */
        const result = await db.raw(`
            SELECT DISTINCT ON (md.c_terminal_sn)
                md.c_project,
                md.c_station,
                md.c_terminal_sn,
                t.c_terminal_sn,
                t.c_terminal_type,
                md.n_status,
                md.d_monitoring,
                md.data,
                md.devices
            FROM opr.t_d_monitoring_device md
            JOIN master.t_m_terminal t
                ON t.c_terminal_sn = md.c_terminal_sn
                AND t.c_project = md.c_project
                AND t.b_active = true
                AND t.d_deleted_at IS NULL
            
            ORDER BY md.c_terminal_sn, md.d_monitoring DESC
        `);

        return {
            code: 0,
            data: result.rows
        };

    } catch (err) {
        return {
            code: "1500",
            message: "Failed to fetch monitoring data",
            data: err
        }; 
    }
};