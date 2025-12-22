import db from '../../config/database.js';

export const getDeviceByProject = async (c_project) => {
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
            d.c_terminal,
            d.n_lat,
            d.n_lng,
            r.d_time_sensor,
            
            r.created_at,
            COALESCE(r.data->>'status', 'No Data') AS status
            `)
        )
        .from({ d: "config.t_d_device" })

        .leftJoin({ r: "opr.t_d_monit_raw" }, function () {
            this.on("r.c_device", "=", "d.c_device")
            .andOn("r.c_project", "=", "d.c_project");
        })

        .leftJoin({ p: "config.t_d_project" }, "d.c_project", "p.c_project")

        .leftJoin({ ttype: "config.t_d_device_type" }, db.raw("(d.c_device_type)::int"), "ttype.c_device_type")

        .leftJoin({ tsub: "config.t_d_device_subtype" }, function () {
            this.on(db.raw("(d.c_device_type)::int = tsub.c_device_type"))
            .andOn("d.c_device_subtype", "=", "tsub.c_device_subtype");
        })
        .where('d.b_active', true)
        .andWhere('d.c_project', c_project) 
        .orderBy([
            { column: "d.c_device", order: "asc" },
            { column: "r.d_time_sensor", order: "desc" }
        ]);

// console.log(result)
        return {code: 0, message: result}
    } catch (err) {
        // console.log(err)
        return {code : "2110", data : err}
    }
}