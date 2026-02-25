import db from "../../config/database.js";

export const getFreeTerminalService = async (c_project = null) => {
    try {

        const query = db("master.t_m_terminal")
            .select(
                "i_id",
                "c_terminal_sn",
                "c_terminal_01",
                "c_terminal_02",
                "c_terminal_type",
                "c_project",
                "c_station",
                "n_terminal_name",
                "b_active",
                "c_signature",
                "i_sync_id",
                "c_model_code",
                "c_model_name",
                "c_item_serial_code"
            )
            .whereNull("c_terminal_sn")
            .where("b_active", true)
            .whereNull("d_deleted_at")
            .orderBy("c_terminal_01", "asc");

        // optional filter by project
        if (c_project) {
            query.andWhere("c_project", c_project);
        }

        const result = await query;

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "5300",
            message: "Failed to get free terminal",
            data: err
        };
    }
};
