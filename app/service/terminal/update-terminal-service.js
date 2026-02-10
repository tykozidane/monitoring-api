import db from "../../config/database.js";

export const updateTerminal = async (
    c_terminal_sn,
    updatePayload,
    updatedBy
) => {
    try {
        const result = await db("master.t_m_terminal")
        .where("c_terminal_sn", c_terminal_sn)
        .whereNull("d_deleted_at")
        .update({
            ...updatePayload,
            d_updated_at: db.fn.now(),
            n_updated_by: updatedBy
        })
        .returning("*");

        if (result.length === 0) {
        return {
            code: "4041",
            message: "Terminal not found or already deleted"
        };
        }

        return {
        code: 0,
        message: result[0]
        };

    } catch (err) {
        return {
        code: "2202",
        message: "Failed to update terminal",
        data: err
        };
    }
};
