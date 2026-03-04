import db from "../config/database.js";

export const getConfigControllerService = async (i_terminal_type) => {
    try {

        const result = await db("master.t_m_config_controller")
            .select("i_terminal_type", "config")
            .where("i_terminal_type", i_terminal_type)
            .first();

        if (!result) {
            return {
                code: "4040",
                message: "Config not found for this terminal type"
            };
        }

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "6000",
            message: "Failed to get config controller",
            data: err
        };
    }
};