import db from "../../config/database.js";

export const getDeviceTypeByProject = async (c_project) => {
    try {

        const result = await db("master.t_m_device_type")
            .select(
                "c_device_type",
                "n_device_type",
                "c_device",
                "c_project",
                "n_number"
            )
            .where({ c_project })
            .orderBy("c_device_type", "asc");

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        return {
            code: "5100",
            message: "Failed to get device type",
            data: err
        };
    }
};
