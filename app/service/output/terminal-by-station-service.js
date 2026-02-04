import db from '../../config/database.js';

export const getTerminalByStation = async (c_project, c_station) => {
    try {
        const result = await db
        .select(
            "t.c_project",
            "p.n_project_name",
            "p.n_project_desc",

            "t.c_terminal_sn",
            "t.c_terminal_type",
            "t.c_terminal_01",
            "t.c_terminal_02",
            db.raw("TRIM(t.c_station) AS c_station"),
            "st.n_station",

            "t.n_lat",
            "t.n_lng",

            "m.d_monitoring",
            db.raw(`
            COALESCE(UPPER(m.n_status), 'NO DATA') AS status
            `)
        )
        .from({ st: "config.t_d_station" })

        // station → terminal
        .leftJoin({ t: "master.t_m_terminal" }, function () {
            this.on(db.raw("TRIM(t.c_station)"), "=", db.raw("TRIM(st.c_station)"))
            .andOn("t.c_project", "=", "st.c_project")
            .andOn("t.b_active", "=", db.raw("true"))
            .andOnNull("t.d_deleted_at");
        })

        // 🔥 FIX PALING PENTING ADA DI SINI
        .leftJoin(
            db.raw(`
            (
                SELECT DISTINCT ON (c_project, c_terminal_sn)
                c_project,
                c_terminal_sn,
                d_monitoring,
                n_status
                FROM opr.t_d_monitoring_device
                ORDER BY c_project, c_terminal_sn, d_monitoring DESC
            ) m
            `),
            function () {
            this.on("m.c_terminal_sn", "=", "t.c_terminal_sn")
                .andOn("m.c_project", "=", "t.c_project");
            }
        )

        // project
        .leftJoin(
            { p: "config.t_d_project" },
            "st.c_project",
            "p.c_project"
        )

        .where("st.b_active", true)
        .whereNull("st.d_deleted_at")
        .andWhere("st.c_project", c_project)
        .andWhereRaw("TRIM(st.c_station) = TRIM(?)", [c_station])

        .orderBy("t.c_terminal_sn", "asc");

        return { code: 0, message: result };

    } catch (err) {
        return { code: "2120", data: err };
    }
};
