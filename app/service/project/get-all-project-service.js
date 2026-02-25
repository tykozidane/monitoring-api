import db from "../../config/database.js";

export const getAllProjectService = async () => {
    try {

        const result = await db("config.t_d_project")
            .select(
                "c_project",
                "n_project_name",
                "n_project_desc",
            )
            .where({
                b_active: true
            })
            .whereNull("d_deleted_at")

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "6100",
            message: "Failed to get station list",
            data: err
        };
    }
};
