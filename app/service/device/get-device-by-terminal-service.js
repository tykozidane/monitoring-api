import db from "../../config/database.js";

export const getDeviceByTerminalService = async (c_terminal_sn, c_project) => {
    try {

        const result = await db({ d: "master.t_m_device" })
            .select(
                "d.c_device",
                "d.c_serial_number",
                "d.c_device_type",
                "d.c_direction",
                "d.n_device_name",
                "d.c_project",
                "d.c_terminal_sn",
                "d.b_active",
                "d.sub_item_type",
                "d.sub_item_code",
                "d.sub_item_serial_code",
                "dt.n_device_type"
            )
            .leftJoin(
                { dt: "master.t_m_device_type" },
                function () {
                    this.on("dt.c_device_type", "=", "d.c_device_type")
                        .andOn("dt.c_device", "=", "d.c_device")
                        .andOn("dt.c_project", "=", "d.c_project");
                }
            )
            .where({
                "d.c_terminal_sn": c_terminal_sn,
                "d.c_project": c_project,
                "d.b_active": true
            })
            .orderBy("d.c_device", "asc");

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "7200",
            message: "Failed to get device by terminal",
            data: err
        };
    }
};