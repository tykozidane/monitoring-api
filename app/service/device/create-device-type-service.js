import db from "../../config/database.js";

export const createDeviceTypeService = async (payload, createdBy) => {
    const trx = await db.transaction();

    try {
        const {
            c_device_type,
            n_device_type,
            c_device,
            c_project,
            n_number
        } = payload;

        /* ===============================
            1️⃣ CHECK c_device_type + n_number + c_project
        =============================== */
        // const existTypeNumber = await trx("master.t_m_device_type")
        //     .where({
        //         c_device_type,
        //         n_number,
        //         c_project
        //     })
        //     .first();

        // if (existTypeNumber) {
        //     throw {
        //         code: "8001",
        //         message: "Device type number already exists in this project"
        //     };
        // }

        /* ===============================
            2️⃣ CHECK c_device + c_project
        =============================== */
        const existDeviceCode = await trx("master.t_m_device_type")
            .where({
                c_device,
                c_project
            })
            .first();

        if (existDeviceCode) {
            throw {
                code: "02",
                message: "Device Code already exists in this project"
            };
        }

        /* ===============================
            3️⃣ CHECK FULL COMBINATION
        =============================== */
        const existFullCombination = await trx("master.t_m_device_type")
            .where({
                c_device,
                c_device_type,
                n_number,
                c_project
            })
            .first();

        if (existFullCombination) {
            throw {
                code: "03",
                message:
                    "Device type number with this device code already exists in this project"
            };
        }

        /* ===============================
            4️⃣ INSERT DATA
        =============================== */
        const [result] = await trx("master.t_m_device_type")
            .insert({
                c_device_type,
                n_device_type,
                c_device,
                c_project,
                n_number
            })
            .returning("*");

        await trx.commit();

        return {
            code: 0,
            message: result
        };

    } catch (err) {
        await trx.rollback();

        return {
            code: err.code || "8000",
            message: err.message || "Failed to create device type",
            data: err
        };
    }
};