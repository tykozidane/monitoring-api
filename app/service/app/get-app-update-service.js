import db from "../../config/database.js";

export const getAppUpdateService = async (query) => {
    try {

        const { c_terminal_type } = query;

        // 1️⃣ Ambil base URL dari setting
        const setting = await db("master.t_m_setting")
            .where({
                c_setting_key: "url_download_update_app",
                b_active: true
            })
            .first();

        const baseUrl = setting?.c_setting_value || "";

        // 2️⃣ Query app
        let appQuery = db("config.t_m_app")
            .select(
                "i_id",
                "n_app_name",
                "n_app_detail",
                "c_terminal_type",
                "c_project",
                "file_name",
                "d_app_upload",
                "link_download"
            )
            .where("b_active", true)
            .orderBy("d_app_upload", "desc");

        if (c_terminal_type) {
            appQuery = appQuery.where(
                "c_terminal_type",
                c_terminal_type
            );
        }

        const apps = await appQuery;

        // 3️⃣ Tambahkan full link download
        const result = apps.map(app => ({
            ...app,
            link_download: baseUrl
                ? `${baseUrl}${app.link_download}`
                : null
        }));

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "7100",
            message: "Failed to get app update data",
            data: err
        };
    }
};