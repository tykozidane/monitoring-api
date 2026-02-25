import db from "../../config/database.js";

export const addTerminalService = async (payload, createdBy) => {
    try {

        const {
            c_terminal_01,
            c_terminal_02,
            c_terminal_type,
            c_project,
            c_station,
            n_terminal_name,
            n_lat,
            n_lng
        } = payload;

        /* =========================
            VALIDASI DUPLIKAT
           ========================= */
        const existing = await db("master.t_m_terminal")
            .where({
                c_terminal_01,
                c_project,
                c_station,
                b_active: true
            })
            .whereNull("d_deleted_at")
            .first();

        if (existing) {
            return {
                code: "5401",
                message: "Terminal already exists"
            };
        }

        /* =========================
            INSERT
           ========================= */
        const [result] = await db("master.t_m_terminal")
            .insert({
                c_terminal_sn: null,
                c_terminal_01,
                c_terminal_02: c_terminal_02 || null,
                c_terminal_type: c_terminal_type || null,
                c_project,
                c_station,
                n_terminal_name: n_terminal_name || null,
                n_lat: n_lat || null,
                n_lng: n_lng || null,
                b_active: true,
                n_created_by: createdBy
            })
            .returning([
                "i_id",
                "c_terminal_sn",
                "c_terminal_01",
                "c_terminal_02",
                "c_terminal_type",
                "c_project",
                "c_station",
                "n_terminal_name",
                "n_lat",
                "n_lng",
                "b_active"
            ]);

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "5400",
            message: "Failed to add terminal",
            data: err
        };
    }
};
