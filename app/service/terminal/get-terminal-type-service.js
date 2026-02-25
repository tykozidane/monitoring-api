import db from "../../config/database.js";

export const getTerminalTypeService = async (c_project) => {
    try {

        const result = await db("master.t_m_terminal_type")
            .select(
                "i_id",
                "c_terminal_type",
                "n_terminal_name",
                "c_project"
            )
            .where({ c_project })
            .orderBy("c_terminal_type", "asc");

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "7100",
            message: "Failed to get terminal type",
            data: err
        };
    }
};