import db from '../config/database.js';


export const saveToDbFunc = async (c_project, c_device_type, c_device, data) => {
    try {
        const saveData = await db("opr.t_d_monit_raw").insert({
            c_project : c_project,
            c_device_type : c_device_type,
            c_device : c_device,
            d_time_sensor: new Date(),
            data : data
            });
        return {code: 0, message: true}
    } catch (err) {
        return {code : "1200", data : err}
    }
}

export const getBodyList = async (c_project, c_device_type) => {
    try {
        //const saveData = await db.raw(`insert into opr.t_d_monit (data, i_device_id) values ('${data}', '${i_device_id}') returning i_id`)
        const result = await db('config.t_d_body_detail').where({
            c_project: c_project,
            c_device_type: c_device_type
        }).select('n_list')
        return {code: 0, message: result[0]}
    } catch (err) {
        return {code : "1200", data : err}
    }
}

