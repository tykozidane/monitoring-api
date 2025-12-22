import db from '../../config/database.js';

export const getAllDataStation = async () => {
    try{
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
                    WHEN COUNT(r.data) = 0 THEN 'No Data'
                    WHEN SUM(CASE WHEN r.data->>'status' = 'NOT OK' THEN 1 ELSE 0 END) > 0 THEN 'NOT OK'
                    WHEN SUM(CASE WHEN r.data->>'status' = 'Warning' THEN 1 ELSE 0 END) > 0 THEN 'Warning'
                    WHEN SUM(CASE WHEN r.data->>'status' = 'OK' THEN 1 ELSE 0 END) = COUNT(r.data) THEN 'OK'
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

            // 🔥 Trim comparison for c_station
            .leftJoin({ d: "config.t_d_device" }, function () {
                this.on(db.raw("TRIM(d.c_station)"), "=", db.raw("TRIM(st.c_station)"))
                .andOn("d.c_project", "=", "st.c_project")
                .andOn("d.b_active", "=", db.raw("true"));
            })

            // Join monitoring
            .leftJoin({ r: "opr.t_d_monit_raw" }, function () {
                this.on("r.c_device", "=", "d.c_device")
                .andOn("r.c_project", "=", "d.c_project");
            })

            .where("st.b_active", true)

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


// console.log(result)
        return {code: 0, message: result}
    } catch (err) {
        // console.log(err)
        return {code : "2100", data : err}
    }
}