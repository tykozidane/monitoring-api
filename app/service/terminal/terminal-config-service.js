import db from "../../config/database.js";

/**
 * Get setting by project
 */
export const getSettingsByProject = async (c_project) => {
    try {
        const rows = await db("master.t_m_setting")
        .select("c_setting_key", "c_setting_value")
        .where("c_project", c_project)
        .where("b_active", true)
        .whereIn("c_setting_key", [
            "url_api",
            "url_api_transaction",
            "basic_auth_username",
            "basic_auth_password"
        ]);
        console.log(rows)
        // Default object
        return {
        url_api: rows.find(r => r.c_setting_key === "url_api")?.c_setting_value || null,
        url_api_transaction: rows.find(r => r.c_setting_key === "url_api_transaction")?.c_setting_value || null,
        basic_auth_username: rows.find(r => r.c_setting_key === "basic_auth_username")?.c_setting_value || null,
        basic_auth_password: rows.find(r => r.c_setting_key === "basic_auth_password")?.c_setting_value || null
        };

    } catch (err) {
        throw {
        code: "3101",
        message: "Failed to get project settings",
        data: err
        };
    }
};

/**
 * Get terminal
 */
export const getTerminal = async (c_terminal_sn, c_project) => {
    return db("master.t_m_terminal")
    .where("c_terminal_sn", c_terminal_sn)
    .where("c_project", c_project.toUpperCase())
    .where("b_active", true)
    .whereNull("d_deleted_at")
    .first();
};

/**
 * Get devices by terminal
 */
export const getDevices = async (c_terminal_sn) => {
    return db("master.t_m_device")
    .where("c_terminal_sn", c_terminal_sn)
    .where("b_active", true)
    .whereNull("d_deleted_at");
};
