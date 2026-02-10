import db from "../../config/database.js";

export const validateStation = async (req, res, next) => {
    try {
        const { c_project, c_station } = req.body;

        if (!c_station) {
        return res.status(400).json({
            code: "4002",
            message: "c_station is required"
        });
        }

        const station = await db("config.t_d_station")
        .where("c_project", c_project)
        .andWhereRaw("TRIM(c_station) = TRIM(?)", [c_station])
        .where("b_active", true)
        .whereNull("d_deleted_at")
        .first();

        if (!station) {
        return res.status(404).json({
            code: "4042",
            message: "c_station not found for this c_project"
        });
        }

        req.station = station;
        next();

    } catch (err) {
        return res.status(500).json({
        code: "5002",
        message: "Failed to validate station",
        error: err
        });
    }
};
