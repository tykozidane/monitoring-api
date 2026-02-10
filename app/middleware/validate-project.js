import db from "../../config/database.js";

export const validateProject = async (req, res, next) => {
    try {
        const { c_project } = req.body;

        if (!c_project) {
        return res.status(400).json({
            code: "4000",
            message: "c_project is required"
        });
        }

        const project = await db("config.t_d_project")
        .where("c_project", c_project)
        .where("b_active", true)
        .whereNull("d_deleted_at")
        .first();

        if (!project) {
        return res.status(404).json({
            code: "4041",
            message: "c_project not found or inactive"
        });
        }

        req.project = project;
        next();

    } catch (err) {
        return res.status(500).json({
        code: "5001",
        message: "Failed to validate project",
        error: err
        });
    }
};
