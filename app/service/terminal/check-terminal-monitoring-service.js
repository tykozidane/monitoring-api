import db from "../../config/database.js";

export const getTerminalLatestMonitoringService = async (c_project) => {
    try {

        const query = db
            .select(
                "t.c_terminal_sn",
                "t.n_terminal_name",
                db.raw("MAX(m.d_monitoring) as latest_time_monitoring")
            )
            .from({ t: "master.t_m_terminal" })
            .leftJoin({ m: "opr.t_d_monitoring_device" }, function () {
                this.on("m.c_terminal_sn", "=", "t.c_terminal_sn")
                    .andOn("m.c_project", "=", "t.c_project");
            })
            .whereNotNull("t.c_terminal_sn")
            .where("t.b_active", true)
            .whereNull("t.d_deleted_at")
            .groupBy("t.c_terminal_sn", "t.n_terminal_name")
            .orderBy("latest_time_monitoring", "desc");

        if (c_project) {
            query.andWhere("t.c_project", c_project);
        }

        const result = await query;

        return {
            code: 0,
            message: result
        };

    } catch (err) {

        return {
            code: "2400",
            message: "Failed to get terminal monitoring",
            data: err
        };

    }
};