import db from '../../config/database.js';

export const getDetailDevice= async (c_project, c_device) => {
    try{
        const result = await db
        .select(
            db.raw(`DISTINCT ON (d.c_device)
                d.c_project,
                p.n_project_name,
                p.n_project_desc,
                d.c_device,
                d.n_device_name,
                d.c_device_type,
                ttype.n_device_type_name,
            d.c_device_subtype,
            tsub.n_device_subtype_name,
            d.c_station,
            st.n_station,
            d.c_terminal,
            d.n_lat,
            d.n_lng,
            r.d_time_sensor,
            
            r.created_at,
            COALESCE(r.data->>'status', 'No Data') AS status
            `),
            db.raw(`COALESCE(r.data, '{}'::jsonb) AS data`)   // ← ADD HERE
            
        )
        .from({ d: "config.t_d_device" })

        .leftJoin({ r: "opr.t_d_monit_raw" }, function () {
            this.on("r.c_device", "=", "d.c_device")
            .andOn("r.c_project", "=", "d.c_project");
        })
        .leftJoin({ st: "config.t_d_station" }, function () {
                this.on(db.raw("TRIM(d.c_station)"), "=", db.raw("TRIM(st.c_station)"));
            })
        .leftJoin({ p: "config.t_d_project" }, "d.c_project", "p.c_project")

        .leftJoin({ ttype: "config.t_d_device_type" }, db.raw("(d.c_device_type)::int"), "ttype.c_device_type")

        .leftJoin({ tsub: "config.t_d_device_subtype" }, function () {
            this.on(db.raw("(d.c_device_type)::int = tsub.c_device_type"))
            .andOn("d.c_device_subtype", "=", "tsub.c_device_subtype");
        })
        .where('d.b_active', true)
        .andWhere('d.c_project', c_project) 
        .andWhere('d.c_device', c_device) 
        .orderBy([
            { column: "d.c_device", order: "asc" },
            { column: "r.d_time_sensor", order: "desc" }
        ]);

// console.log(result)
        return {code: 0, message: result[0]}
    } catch (err) {
        // console.log(err)
        return {code : "2120", data : err}
    }
}