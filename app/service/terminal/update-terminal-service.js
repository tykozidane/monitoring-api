import db from '../../config/database.js';

export const updateTerminal = async (payload, updatedBy) => {
    try {
        const {
        c_terminal_sn,
        ...updateData
        } = payload;

        const result = await db("master.t_m_terminal")
        .where("c_terminal_sn", c_terminal_sn)
        .whereNull("d_deleted_at")
        .update({
            ...updateData,
            d_updated_at: db.fn.now(),
            n_updated_by: updatedBy
        })
        .returning([
            "c_terminal_sn",
            "c_terminal_01",
            "c_terminal_02",
            "c_terminal_type",
            "c_project",
            "c_station",
            "n_terminal_name",
            "n_lat",
            "n_lng",
            "b_active",
            "d_updated_at",
            "n_updated_by"
        ]);

        if (result.length === 0) {
        return {
            code: "4040",
            message: "Terminal not found or already deleted"
        };
        }

        return { code: 0, message: result[0] };

    } catch (err) {
        return {
        code: "2202",
        message: "Failed to update terminal",
        data: err
        };
    }
};
