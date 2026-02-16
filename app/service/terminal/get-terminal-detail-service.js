import db from "../../config/database.js";

export const getTerminalDetail = async (c_terminal_sn, c_project) => {
    try {
        const result = await db
        .select(
            "t.i_id",
            "t.c_terminal_sn",
            "t.c_terminal_01",
            "t.c_terminal_02",
            "t.c_terminal_type",
            "t.c_project",
            "t.c_station",
            "t.n_terminal_name",
            "t.n_lat",
            "t.n_lng",
            "t.c_model_code",
            "t.c_model_name",
            "t.c_item_serial_code",
            "t.c_signature",

            db.raw(`
            COALESCE(
                json_agg(
                json_build_object(
                    'i_id', d.i_id,
                    'c_device', d.c_device,
                    'c_serial_number', d.c_serial_number,
                    'c_device_type', d.c_device_type,
                    'c_direction', d.c_direction,
                    'n_device_name', d.n_device_name,
                    'sub_item_type', d.sub_item_type,
                    'sub_item_code', d.sub_item_code,
                    'sub_item_serial_code', d.sub_item_serial_code
                )
                ) FILTER (WHERE d.i_id IS NOT NULL),
                '[]'
            ) AS devices
            `)
        )
        .from({ t: "master.t_m_terminal" })

        .leftJoin({ d: "master.t_m_device" }, function () {
            this.on("d.c_terminal_sn", "=", "t.c_terminal_sn")
            .andOn("d.c_project", "=", "t.c_project")
            .andOn("d.b_active", "=", db.raw("true"));
        })

        .where("t.c_terminal_sn", c_terminal_sn)
        .andWhere("t.c_project", c_project)
        .andWhere("t.b_active", true)

        .groupBy("t.i_id");

        return { code: 0, message: result[0] || null };

    } catch (err) {
        return {
        code: "2600",
        message: "Failed to get terminal detail",
        data: err
        };
    }
};
