import db from "../../config/database.js";

export const updateTerminalCoordinateService = async (payload, updatedBy) => {
    const trx = await db.transaction();

    try {
        const {
            c_project,
            c_terminal_01,
            c_station,
            n_lat,
            n_lng
        } = payload;

        if (!c_project || !c_terminal_01) {
            throw {
                code: "4000",
                message: "c_project and c_terminal_01 are required"
            };
        }

        /* =========================
            VALIDASI LAT LNG
        ========================== */
        if (n_lat && isNaN(parseFloat(n_lat))) {
            throw { code: "4001", message: "Invalid n_lat" };
        }

        if (n_lng && isNaN(parseFloat(n_lng))) {
            throw { code: "4002", message: "Invalid n_lng" };
        }

        /* =========================
            1️⃣ CEK TERMINAL
        ========================== */
        const terminal = await trx("master.t_m_terminal")
            .where("c_project", c_project)
            .andWhereRaw("TRIM(c_terminal_01) = TRIM(?)", [c_terminal_01])
            .modify(qb => {
                if (c_station) {
                    qb.andWhereRaw("TRIM(c_station) = TRIM(?)", [c_station]);
                }
            })
            .where("b_active", true)
            .whereNull("d_deleted_at")
            .first();

        if (!terminal) {
            throw {
                code: "4040",
                message: "Terminal not found"
            };
        }

        /* =========================
            2️⃣ UPDATE
        ========================== */
        await trx("master.t_m_terminal")
            .where("i_id", terminal.i_id)
            .update({
                n_lat: n_lat ?? terminal.n_lat,
                n_lng: n_lng ?? terminal.n_lng,
                d_updated_at: trx.fn.now(),
                n_updated_by: updatedBy
            });

        await trx.commit();

        return {
            code: 0,
            message: "Terminal coordinate updated successfully"
        };

    } catch (err) {
        await trx.rollback();

        return {
            code: err.code || "5000",
            message: err.message || "Failed to update terminal coordinate",
            data: err
        };
    }
};