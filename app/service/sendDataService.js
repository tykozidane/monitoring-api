import db from '../config/database.js';


export const saveToDbFunc = async (data, i_device_id, d_time_sensor) => {
        try {
            //const saveData = await db.raw(`insert into opr.t_d_monit (data, i_device_id) values ('${data}', '${i_device_id}') returning i_id`)
            const saveData = await db('opr.t_d_monit').returning('*').insert({data: data, i_device_id:i_device_id, d_time_sensor: d_time_sensor})
            return {code: 0, message: saveData[0]}
        } catch (err) {
            return {code : "1100", data : err}
        }
    }
export const checkDeviceFunc = async (i_device_id) => {
        try {
            const get = await db.raw(`select * from config.t_d_device where c_device = '${i_device_id}' and b_active = true`)
            return {code: 0, message: get.rows[0]}
        } catch (err) {
            return {code: "1101", data: err}
        }
    }

export const getDataSensorFunc = async (array) => {
    try {
        const get = await db.raw(`select tdst.i_id ,tdst.c_sensor_type ,tdst.c_measure ,tdst.n_sensor_name ,tdst.n_sensor_name, tdst.c_loki_name ,tdst.b_active , tdm.n_measure  from config.t_d_sensor_type tdst 
left join config.t_d_measure tdm on tdst.c_measure = tdm.c_measure 
where tdst.c_sensor_type  in (${array.toString()})`)
        // console.log("GetData", get)
        return {code: 0, message: get.rows}
    } catch (err) {
        return {code: "1102", data: err}
    }
}
