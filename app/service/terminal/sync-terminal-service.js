import db from '../../config/database.js';

export const checkTerminal = async (c_terminal_sn) => {
    try{
        const result = await db('master.t_m_terminal')
    .where('c_terminal_sn', c_terminal_sn)
    .whereNull('d_deleted_at') // opsional jika pakai soft delete
    .first();
// console.log(result)
        return {code: 0, message: result}
    } catch (err) {
        // console.log(err)
        return {code : "2210", data : err}
    }
}

export const insertNewTerminal = async (dataInsert) => {
    try{
        const result = await db('master.t_m_terminal')
        .insert(dataInsert)
        .returning('*');
        return {code: 0, message: result}
    } catch (err) {
        // console.log(err)
        return {code : "2211", data : err}
    }
}

export const updateTerminalBySN = async (c_terminal_sn, dataUpdate) => {
    try{
        const result = await db('master.t_m_terminal')
        .where('c_terminal_sn', c_terminal_sn)
        .whereNull('d_deleted_at')
        .update(dataUpdate)
        .returning('*');
        return {code: 0, message: result}
    } catch (err) {
        // console.log(err)
        return {code : "2212", data : err}
    }
}


/**
 * Get terminal by SN (not deleted)
 */
export const getTerminalBySN = async (sn) => {
    return db("master.t_m_terminal")
    .where("c_terminal_sn", sn)
    .whereNull("d_deleted_at")
    .whereNull("n_deleted_by")
    .first();
};

/**
 * Insert terminal
 */
export const insertTerminal = async (payload, created_by) => {
    const [result] = await db("master.t_m_terminal")
        .insert({
        ...payload,
        d_created_at: db.fn.now(),
        n_created_by: created_by
        })
        .returning("*");

    return result;
};

/**
 * Update terminal
 */
export const updateTerminal = async (sn, payload, updated_by) => {
    const [result] = await db("master.t_m_terminal")
        .where("c_terminal_sn", sn)
        .whereNull("d_deleted_at")
        .update({
        ...payload,
        d_updated_at: db.fn.now(),
        n_updated_by: updated_by
        })
        .returning("*");

    return result;
};

/**
 * Get devices by terminal SN
 */
export const getDevicesByTerminal = async (sn) => {
    return db("master.t_m_device")
        .where("c_terminal_sn", sn)
        .whereNull("d_deleted_at");
};

/**
 * Insert device
 */
export const insertDevice = async (device, sn, c_project, created_by) => {
    return db("master.t_m_device").insert({
        ...device,
        c_terminal_sn: sn,
        c_project: c_project,
        d_created_at: db.fn.now(),
        n_created_by: created_by
    });
};

/**
 * Update device
 */
export const updateDevice = async (device, sn, c_project, updated_by) => {
    return db("master.t_m_device")
        .where("c_terminal_sn", sn)
        .where("c_device", device.c_device)
        .whereNull("d_deleted_at")
        .update({
        ...device,
        c_project: c_project,
        d_updated_at: db.fn.now(),
        n_updated_by: updated_by
        });
};

/**
 * Soft delete device
 */
export const softDeleteDevice = async (sn, c_device, deleted_by) => {
    return db("master.t_m_device")
        .where("c_terminal_sn", sn)
        .where("c_device", c_device)
        .whereNull("d_deleted_at")
        .update({
        d_deleted_at: db.fn.now(),
        n_deleted_by: deleted_by,
        b_active: false
    });
};