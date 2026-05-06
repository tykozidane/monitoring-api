import db from "../../config/database.js";

export const getFreeTerminalService = async (c_project = null) => {
    try {

        const query = db("master.t_m_terminal as t")
    .select(
        "t.i_id",
        "t.c_terminal_sn",
        "t.c_terminal_01",
        "t.c_terminal_02",
        "t.c_terminal_type",
        "t.c_project",
        "t.c_station",
        "t.n_terminal_name",
        "t.b_active",
        "t.c_signature",
        "t.i_sync_id",
        "t.c_model_code",
        "t.c_model_name",
        "t.c_item_serial_code",
        "s.n_station" // tambahan dari table station
    )
    .leftJoin("config.t_d_station as s", function () {
        this.on(
            db.raw("TRIM(t.c_station)"),
            "=",
            db.raw("TRIM(s.c_station)")
        )
            .andOn("t.c_project", "=", "s.c_project")
            .andOnNull("s.d_deleted_at"); // optional: hanya ambil yang tidak dihapus
    })
    .whereNull("t.c_terminal_sn")
    .where("t.b_active", true)
    .where("s.b_active", true)
    .whereNull("t.d_deleted_at")
    .orderBy("t.c_terminal_01", "asc");

// optional filter by project
if (c_project) {
    query.andWhere("t.c_project", c_project);
}

const result = await query;

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "5300",
            message: "Failed to get free terminal",
            data: err
        };
    }
};
