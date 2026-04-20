import db from "../../config/database.js";

export const getTerminalCoordinateService = async (c_project, c_station) => {
    try {

        if (!c_project || !c_station) {
            return {
                code: "4000",
                message: "c_project and c_station are required"
            };
        }

        const terminals = await db("master.t_m_terminal")
            .select(
                "c_terminal_sn",
                "c_terminal_01",
                "c_terminal_02",
                "c_terminal_type",
                db.raw("TRIM(c_station) as c_station"),
                "n_terminal_name",
                "n_lat",
                "n_lng"
            )
            .where("c_project", c_project)
            .andWhereRaw("TRIM(c_station) = TRIM(?)", [c_station])
            .where("b_active", true)
            .whereNull("d_deleted_at")
            .orderBy("c_terminal_01", "asc");

        // optional: convert lat/lng ke number (siap untuk map)
        const result = terminals.map(t => ({
            ...t,
            n_lat: t.n_lat ? parseFloat(t.n_lat) : null,
            n_lng: t.n_lng ? parseFloat(t.n_lng) : null
        }));

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "5000",
            message: "Failed to get terminal coordinate",
            data: err
        };
    }
};