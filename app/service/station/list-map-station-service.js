import db from "../../config/database.js";

export const getListMapStationService = async (c_project) => {
    try {

        if (!c_project) {
            return {
                code: "4000",
                message: "c_project is required"
            };
        }

        const stations = await db("config.t_d_station")
            .select(
                "c_station",
                "n_station",
                "n_lat",
                "n_lng"
            )
            .where({
                c_project,
                b_active: true
            })
            .whereNull("d_deleted_at")
            .orderBy("n_station", "asc");

        return {
            code: 0,
            message: stations
        };

    } catch (err) {
        return {
            code: "5000",
            message: "Failed to get station map list",
            data: err
        };
    }
};