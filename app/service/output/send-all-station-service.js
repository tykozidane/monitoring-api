import db from "../../config/database.js";

export const getAllDataStation = async (c_project) => {
    try {

        /* ===============================
            1️⃣ LATEST MONITORING (VALID TERMINAL ONLY)
        =============================== */
        const query = db
    .select(
        "st.c_project",
        "p.n_project_name",
        "p.n_project_desc",
        "st.c_station",
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

    // 🔥 LATERAL JOIN
    .leftJoin(
        db.raw(`
            LATERAL (
                SELECT
                    m.n_status
                FROM opr.t_d_monitoring_device m

                JOIN master.t_m_terminal t
                    ON t.c_terminal_sn = m.c_terminal_sn
                    AND t.c_project = m.c_project
                    AND t.c_station = m.c_station
                    AND t.b_active = true
                    AND t.d_deleted_at IS NULL

                WHERE
                    m.c_project = st.c_project
                    AND m.c_station = st.c_station

                ORDER BY m.d_monitoring DESC
                LIMIT 1
            ) lm
        `),
        db.raw("true"),
        db.raw("true")
    )

    .where("st.b_active", true);

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