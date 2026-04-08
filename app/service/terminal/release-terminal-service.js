import db from "../../config/database.js";

export const releaseTerminalService = async (
    c_terminal_sn,
    c_project,
    updatedBy
) => {

    const trx = await db.transaction();

    try {

        // 1️⃣ Cek terminal ada
        const terminal = await trx("master.t_m_terminal")
            .where({
                c_terminal_sn,
                c_project,
                b_active: true
            })
            .whereNull("d_deleted_at")
            .first();

        if (!terminal) {
            throw {
                code: "4040",
                message: "Terminal tidak ditemukan"
            };
        }

        // 2️⃣ Update release
        await trx("master.t_m_terminal")
            .where({ i_id: terminal.i_id })
            .update({
                c_terminal_sn: null,
                c_signature: null,
                c_model_code: null,
                c_model_name: null,
                c_item_serial_code: null,
                d_updated_at: trx.fn.now(),
                n_updated_by: updatedBy
            });
        
        // Update b_mapping di sync terminal
        await trx("sync.t_m_sync_terminal")
            .where({ serial_number: c_terminal_sn })
            .update({
                b_mapping: true
            });
        await trx.commit();

        return {
            code: 0,
            message: "Terminal berhasil direlease"
        };

    } catch (err) {

        await trx.rollback();

        return {
            code: err.code || "3500",
            message: err.message || "Failed to release terminal",
            data: err
        };
    }
};
