import db from "../../config/database.js";

export const getAllDataStation = async (c_project) => {
    try {

        /* ===============================
            1️⃣ LATEST MONITORING (VALID TERMINAL ONLY)
        =============================== */
        const latestMonitoring = db
            .select(
                "x.c_project",
                "x.c_station",
                "x.n_status"
            )
            .from(
                db.raw(`
                    (
                        SELECT DISTINCT ON (
                            m.c_project,
                            TRIM(m.c_station)
                        )
                            m.c_project,
                            TRIM(m.c_station) AS c_station,
                            m.n_status,
                            m.d_monitoring
                        FROM opr.t_d_monitoring_device m

                        JOIN master.t_m_terminal t
                            ON t.c_terminal_sn = m.c_terminal_sn
                            AND t.c_project = m.c_project
                            AND TRIM(t.c_station) = TRIM(m.c_station)
                            AND t.b_active = true
                            AND t.d_deleted_at IS NULL

                        ORDER BY
                            m.c_project,
                            TRIM(m.c_station),
                            m.d_monitoring DESC
                    ) x
                `)
            )
            .as("lm");
        // const latestMonitoring = db("opr.t_d_monitoring_device as m1")
        //     .select(
        //         "m1.c_project",
        //         db.raw("TRIM(m1.c_station) as c_station"),
        //         "m1.n_status"
        //     )
        //     .join("master.t_m_terminal as t", function () {
        //         this.on("t.c_terminal_sn", "=", "m1.c_terminal_sn")
        //             // 🔥 TRIM station
        //             .andOn(
        //                 db.raw("TRIM(t.c_station)"),
        //                 "=",
        //                 db.raw("TRIM(m1.c_station)")
        //             )
        //             .andOn("t.c_project", "=", "m1.c_project")
        //             .andOn("t.b_active", "=", db.raw("true"))
        //             .andOnNull("t.d_deleted_at");
        //     })
        //     .whereRaw(`
        //         m1.d_monitoring = (
        //             SELECT MAX(m2.d_monitoring)
        //             FROM opr.t_d_monitoring_device m2
        //             JOIN master.t_m_terminal t2
        //                 ON t2.c_terminal_sn = m2.c_terminal_sn
        //                 AND TRIM(t2.c_station) = TRIM(m2.c_station)
        //                 AND t2.c_project = m2.c_project
        //                 AND t2.b_active = true
        //                 AND t2.d_deleted_at IS NULL
        //             WHERE m2.c_project = m1.c_project
        //             AND TRIM(m2.c_station) = TRIM(m1.c_station)
        //         )
        //     `)
        //     .as("lm");

        /* ===============================
            2️⃣ MAIN QUERY
        =============================== */

        const query = db
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
                        WHEN lm.n_status IS NULL THEN 'No Data'
                        WHEN LOWER(lm.n_status) = 'danger' THEN 'DANGER'
                        WHEN LOWER(lm.n_status) = 'warning' THEN 'WARNING'
                        WHEN LOWER(lm.n_status) = 'normal' THEN 'NORMAL'
                        ELSE 'No Data'
                    END AS status
                `)
            )
            .from({ st: "config.t_d_station" })

            .leftJoin(
                { p: "config.t_d_project" },
                "st.c_project",
                "p.c_project"
            )

            .leftJoin(latestMonitoring, function () {
                this.on("lm.c_project", "=", "st.c_project")
                    .andOn(db.raw("lm.c_station"), "=", db.raw("TRIM(st.c_station)"));
            })

            .where("st.b_active", true);

        if (c_project) {
            query.andWhere("st.c_project", c_project);
        }

        query
            .orderBy("st.c_project", "asc")
            .orderBy(db.raw("TRIM(st.c_station)"), "asc");

        const result = await query;

        return {
            code: 0,
            message: result
        };

    } catch (err) {

        return {
            code: "2100",
            data: err
        };

    }
};