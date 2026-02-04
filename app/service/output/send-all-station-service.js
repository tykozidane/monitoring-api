import db from '../../config/database.js';

export const getAllDataStation = async () => {
    try {
        const result = await db
        .select(
            "st.c_project",
            "p.n_project_name",
            "p.n_project_desc",
            db.raw("TRIM(st.c_station) AS c_station"),
            "st.n_station",
            "st.n_lat",
            "st.n_lng",

            db.raw(`
            CASE
                WHEN COUNT(m.i_id) = 0 THEN 'NO DATA'

                WHEN SUM(
                CASE WHEN LOWER(m.n_status) = 'danger' THEN 1 ELSE 0 END
                ) > 0 THEN 'DANGER'

                WHEN SUM(
                CASE WHEN LOWER(m.n_status) = 'warning' THEN 1 ELSE 0 END
                ) > 0 THEN 'WARNING'

                WHEN SUM(
                CASE WHEN LOWER(m.n_status) = 'normal' THEN 1 ELSE 0 END
                ) > 0 THEN 'NORMAL'

                ELSE 'NO DATA'
            END AS status
            `)
        )
        .from({ st: "config.t_d_station" })

        // project
        .leftJoin(
            { p: "config.t_d_project" },
            "st.c_project",
            "p.c_project"
        )

        // station → terminal
        .leftJoin({ t: "master.t_m_terminal" }, function () {
            this.on(db.raw("TRIM(t.c_station)"), "=", db.raw("TRIM(st.c_station)"))
            .andOn("t.c_project", "=", "st.c_project")
            .andOn("t.b_active", "=", db.raw("true"))
            .andOnNull("t.d_deleted_at");
        })

        // 🔥 JOIN MONITORING TERAKHIR PER TERMINAL
        .leftJoin(
            db.raw(`
            (
                SELECT DISTINCT ON (c_terminal_sn)
                i_id,
                c_project,
                c_terminal_sn,
                c_station,
                n_status
                FROM opr.t_d_monitoring_device
                ORDER BY c_terminal_sn, d_monitoring DESC
            ) m
            `),
            function () {
            this.on("m.c_terminal_sn", "=", "t.c_terminal_sn")
                .andOn("m.c_project", "=", "t.c_project");
            }
        )

        .where("st.b_active", true)
        .whereNull("st.d_deleted_at")

        .groupBy(
            "st.c_project",
            "p.n_project_name",
            "p.n_project_desc",
            db.raw("TRIM(st.c_station)"),
            "st.n_station",
            "st.n_lat",
            "st.n_lng"
        )

        .orderBy("st.c_project", "asc")
        .orderBy(db.raw("TRIM(st.c_station)"), "asc");

        return { code: 0, message: result };

    } catch (err) {
        return { code: "2100", data: err };
    } 
};
