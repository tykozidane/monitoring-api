import db from "../../config/database.js";

export const updateDataTypeThresholdService = async (payload, updatedBy) => {
    const trx = await db.transaction();

    try {
        const {
            i_id,
            l_warning_up,
            l_warning_down,
            l_danger_up,
            l_danger_down
        } = payload;

        if (!i_id) {
            throw {
                code: "4000",
                message: "i_id is required"
            };
        }

        /* =========================
            1️⃣ CEK DATA
        ========================== */
        const data = await trx("master.t_m_data_type")
            .where("i_id", i_id)
            .where("b_active", true)
            .whereNull("d_deleted_at")
            .first();

        if (!data) {
            throw {
                code: "4040",
                message: "Data type not found"
            };
        }

        /* =========================
            2️⃣ VALIDASI LOGIKA (OPTIONAL TAPI BAGUS)
        ========================== */
        if (
            l_warning_up !== null &&
            l_danger_up !== null &&
            l_warning_up > l_danger_up
        ) {
            throw {
                code: "4001",
                message: "warning_up cannot be greater than danger_up"
            };
        }

        if (
            l_warning_down !== null &&
            l_danger_down !== null &&
            l_warning_down < l_danger_down
        ) {
            throw {
                code: "4002",
                message: "warning_down cannot be less than danger_down"
            };
        }

        /* =========================
            3️⃣ UPDATE
        ========================== */
        await trx("master.t_m_data_type")
            .where("i_id", i_id)
            .update({
                l_warning_up: l_warning_up ?? data.l_warning_up,
                l_warning_down: l_warning_down ?? data.l_warning_down,
                l_danger_up: l_danger_up ?? data.l_danger_up,
                l_danger_down: l_danger_down ?? data.l_danger_down,
                d_updated_at: trx.fn.now(),
                n_updated_by: updatedBy
            });

        await trx.commit();

        return {
            code: 0,
            message: "Threshold updated successfully"
        };

    } catch (err) {
        await trx.rollback();

        return {
            code: err.code || "5000",
            message: err.message || "Failed to update threshold",
            data: err
        };
    }
};