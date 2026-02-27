import db from "../../config/database.js";

export const getSpareGateService = async (c_station, c_project) => {
    try {
        console.log("getSpareGateService called with:", { c_station, c_project });
        const result = await db
            .select(
                "g.c_terminal_01",
                "g.c_terminal_02",
                "g.c_station",
                "g.n_terminal_name",
                "g.c_project"
            )
            .from({ g: "sync.t_m_gate" })

            .leftJoin({ t: "master.t_m_terminal" }, function () {
                this.on("g.c_terminal_01", "=", "t.c_terminal_01")
                    .andOn("g.c_station", "=", "t.c_station")
                    .andOn("g.c_project", "=", "t.c_project")
                    .andOn("t.b_active", "=", db.raw("true"))
                    .andOnNull("t.d_deleted_at");
            })

            .where("g.c_station", c_station)
            .andWhere("g.c_project", c_project)
            .whereNull("t.c_terminal_01")   // 🔥 hanya yang belum ada di master

            .orderBy("g.c_terminal_01", "asc");

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        console.error("Error in getSpareGateService:", err);
        return {
            code: "3100",
            message: "Failed to get spare gate",
            data: err
        };
    }
};