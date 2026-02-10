import db from "../../config/database.js";

export const getSyncTerminalStatus = async () => {
    try {
        const result = await db
        .select(
            "s.i_id as sync_id",
            "s.item_serial_code",
            "s.client_name",
            "s.model_code",
            "s.model_name",
            "s.station_code",
            "s.station_name",
            "s.d_sync",
            "s.b_mapping",
            "s.b_active",

            "t.i_id as terminal_id",
            "t.c_terminal_sn",
            "t.c_project",
            "t.c_station",
            "t.c_terminal_type",

            db.raw(`
            CASE
                WHEN t.c_terminal_sn IS NULL THEN 'NOT_MATCH'
                ELSE 'MATCH'
            END AS match_status
            `),

            db.raw(`
            CASE
                WHEN t.c_terminal_sn IS NULL THEN NULL
                WHEN s.c_signature = t.c_signature THEN 'SIGNATURE_IDENTIC'
                ELSE 'SIGNATURE_NOT_IDENTIC'
            END AS signature_status
            `)
        )
        .from({ s: "sync.t_m_sync_terminal" })

        .leftJoin({ t: "master.t_m_terminal" }, function () {
            this.on("t.c_terminal_sn", "=", "s.item_serial_code")
            .andOn("t.b_active", "=", db.raw("true"));
        })

        .where("s.b_active", true)
        .orderBy("s.d_sync", "desc");

        return { code: 0, message: result };

    } catch (err) {
        return {
        code: "2500",
        message: "Failed to get sync terminal status",
        data: err
        };
    }
};
