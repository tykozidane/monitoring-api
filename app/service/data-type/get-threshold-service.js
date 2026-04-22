import db from "../../config/database.js";

export const getDataTypeThresholdService = async (c_project, c_terminal_type) => {
    try {

        if (!c_project) {
            return {
                code: "4000",
                message: "c_project is required"
            };
        }

        let query = db("master.t_m_data_type")
            .select(
                "i_id",
                "c_data_type",
                "c_project",
                "n_measure",
                "c_terminal_type",
                "l_warning_up",
                "l_warning_down",
                "l_danger_up",
                "l_danger_down"
            )
            .where("c_project", c_project)
            .where("b_active", true)
            .whereNull("d_deleted_at")
            .orderBy("c_data_type", "asc");

        if (c_terminal_type) {
            query.where("c_terminal_type", c_terminal_type);
        }

        const data = await query;

        return {
            code: 0,
            message: data
        };

    } catch (err) {
        return {
            code: "5000",
            message: "Failed to get data type threshold",
            data: err
        };
    }
};