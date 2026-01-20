import db from "../config/database.js";

/**
 * Check duplicate c_project OR n_project_name
 */
export const checkUniqueness = async (c_project, n_project_name) => {
    try {
        const result = await db("config.t_d_project")
        .whereRaw("TRIM(c_project) = ?", [c_project.trim()])
        .orWhereRaw("TRIM(n_project_name) = ?", [n_project_name.trim()])
        .andWhere("b_active", true)
        .first();

        if (result) {
        return {
            code: "2200",
            message: "Project code or project name already exists"
        };
        }

        return { code: 0 };

    } catch (err) {
        return {
        code: "2200",
        message: "Failed to check project uniqueness",
        data: err
        };
    }
};

/**
 * Insert project into database
 */
export const saveToDatabase = async (payload) => {
    try {
        const [result] = await db("config.t_d_project")
        .insert({
            c_project: payload.c_project.trim(),
            n_project_name: payload.n_project_name.trim(),
            n_project_desc: payload.n_project_desc || null,
            b_active: true,
            d_created_at: db.fn.now()
        })
        .returning("*");

        return {
        code: 0,
        data: result
        };

    } catch (err) {
        return {
        code: "2201",
        message: "Failed to save project",
        data: err
        };
    }
};
