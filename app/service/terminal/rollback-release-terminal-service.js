import db from "../../config/database.js";

export const rollbackReleaseTerminalService = async (payload, updatedBy) => {
    const trx = await db.transaction();

    try {

        const {
            c_project,
            c_station,
            c_terminal_01,
            c_terminal_type
        } = payload;

        /* =========================
            1️⃣ CARI TERMINAL
        ========================== */
        const terminal = await trx("master.t_m_terminal")
            .where({
                c_project,
                c_station,
                c_terminal_01,
                c_terminal_type,
                b_active: true
            })
            .whereNull("d_deleted_at")
            .first();

        if (!terminal) {
            throw {
                code: "4041",
                message: "Terminal not found"
            };
        }

        if (!terminal.i_sync_id) {
            throw {
                code: "4042",
                message: "Sync reference not found"
            };
        }

        /* =========================
            2️⃣ AMBIL DATA SYNC
        ========================== */
        const syncData = await trx("sync.t_m_sync_terminal")
            .where({
                i_id: terminal.i_sync_id,
                b_active: true
            })
            .first();

        if (!syncData) {
            throw {
                code: "4043",
                message: "Sync data not found"
            };
        }

        /* =========================
            3️⃣ UPDATE TERMINAL (ROLLBACK)
        ========================== */
        await trx("master.t_m_terminal")
            .where({ i_id: terminal.i_id })
            .update({
                c_terminal_sn: syncData.serial_number,
                c_signature: syncData.c_signature,
                c_model_code: syncData.model_code,
                c_model_name: syncData.model_name,
                d_updated_at: trx.fn.now(),
                n_updated_by: updatedBy
            });

        await trx.commit();

        return {
            code: 0,
            message: "Rollback release terminal successful"
        };

    } catch (err) {
        await trx.rollback();

        return {
            code: err.code || "5000",
            message: err.message || "Failed to rollback release terminal",
            data: err
        };
    }
};