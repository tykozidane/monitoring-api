import db from '../config/database.js';

export const saveError = async (c_error, n_desc, n_message) => {
    try{
    await db('opr.t_d_error').insert({
        c_error: c_error,
        n_desc: n_desc,
        d_error_at: new Date(),
        n_message: n_message
    })
    return true
    } catch (err) {
        return false
    }
}