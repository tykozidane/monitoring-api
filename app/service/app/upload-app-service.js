import db from "../../config/database.js";

export const uploadAppService = async (payload, file, createdBy) => {
    const trx = await db.transaction();

    try {

        const {
            n_app_name,
            n_app_detail,
            c_terminal_type,
            c_project
        } = payload;

        const link_download = `/api/v1/app/download/${file.filename}`;

        const [result] = await trx("config.t_m_app")
            .insert({
                n_app_name,
                n_app_detail,
                c_terminal_type,
                c_project,
                file_name: file.originalname,
                file_size: file.size,
                file_path: file.path,
                link_download,
                n_created_by: createdBy
            })
            .returning("*");

        await trx.commit();

        return { code: 0, message: result };

    } catch (err) {
        await trx.rollback();
        return {
            code: "7000",
            message: "Failed to upload app",
            data: err
        };
    }
};