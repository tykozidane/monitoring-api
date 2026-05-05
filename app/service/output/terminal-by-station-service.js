import db from "../../config/database.js";
export const getTerminalByStation = async (c_station, c_project) => {
    try {
        let query = db
            .select(
                "t.c_project",
                "p.n_project_name",
                "p.n_project_desc",
                "t.n_terminal_name",
                "t.c_terminal_sn",
                "t.c_terminal_type",
                "t.c_terminal_01",
                "t.c_terminal_02",
                db.raw("TRIM(t.c_station) AS c_station"),
                "st.n_station",
                "t.n_lat",
                "t.n_lng",
                "md.d_monitoring",
                db.raw("UPPER(COALESCE(md.n_status, 'NO DATA')) AS status")
            )
            .from({ t: "master.t_m_terminal" })

            .join({ st: "config.t_d_station" }, function () {
                this.on(db.raw("TRIM(st.c_station)"), "=", db.raw("TRIM(t.c_station)"))
                    .andOn("st.c_project", "=", "t.c_project");
            })

            .join({ p: "config.t_d_project" }, "p.c_project", "t.c_project")

            .leftJoin({ md: "opr.t_d_monitoring_device" }, function () {
                this.on("md.c_terminal_sn", "=", "t.c_terminal_sn")
                    .andOn("md.c_project", "=", "t.c_project");
            })

            .where("t.b_active", true)
            .andWhere("t.c_project", c_project);

        // 🔥 conditional filter
        if (c_station && c_station.toLowerCase() !== "all") {
            query.andWhereRaw("TRIM(t.c_station) = TRIM(?)", [c_station]);
        }

        const result = await query
            // .distinctOn("t.c_terminal_sn")
            .orderBy("t.c_terminal_sn")
            .orderBy("md.d_monitoring", "desc");

        return { code: 0, message: result };

    } catch (err) {
        return { code: "2400", message: "Failed get terminal by station", data: err };
    }
};
// export const getTerminalByStation = async (c_station, c_project) => {
//     try {
//         const result = await db
//         .select(
//             "t.c_project",
//             "p.n_project_name",
//             "p.n_project_desc",
//             "t.c_terminal_sn",
//             "t.c_terminal_type",
//             "t.c_terminal_01",
//             "t.c_terminal_02",
//             db.raw("TRIM(t.c_station) AS c_station"),
//             "st.n_station",
//             "t.n_lat",
//             "t.n_lng",
//             "md.d_monitoring",
//             db.raw("UPPER(COALESCE(md.n_status, 'NO DATA')) AS status")
//         )
//         .from({ t: "master.t_m_terminal" })

//         .join({ st: "config.t_d_station" }, function () {
//             this.on(db.raw("TRIM(st.c_station)"), "=", db.raw("TRIM(t.c_station)"))
//             .andOn("st.c_project", "=", "t.c_project");
//         })

//         .join({ p: "config.t_d_project" }, "p.c_project", "t.c_project")

//         .leftJoin({ md: "opr.t_d_monitoring_device" }, function () {
//             this.on("md.c_terminal_sn", "=", "t.c_terminal_sn")
//             .andOn("md.c_project", "=", "t.c_project");
//         })

//         .where("t.b_active", true)
//         .andWhereRaw("TRIM(t.c_station) = TRIM(?)", [c_station])
//         .andWhere("t.c_project", c_project)

//         .distinctOn("t.c_terminal_sn")
//         .orderBy("t.c_terminal_sn")
//         .orderBy("md.d_monitoring", "desc");

//         return { code: 0, message: result };
//     } catch (err) {
//         return { code: "2400", message: "Failed get terminal by station", data: err };
//     }             
// };
