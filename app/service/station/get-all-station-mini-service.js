import db from "../../config/database.js";

export const getAllStationMiniService = async (c_project) => {
    try {

        const result = await db("config.t_d_station")
            .select(
                "c_project",
                db.raw("TRIM(c_station) as c_station"),
                "n_station",
            )
            .where({
                c_project,
                b_active: true
            })
            .whereNull("d_deleted_at")
            .orderBy("c_station", "asc");

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
