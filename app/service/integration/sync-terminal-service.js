import db from "../../config/database.js";

export const insertItem = async (payload, createdBy, signature) => {
    const trx = await db.transaction();

    try {
        const {
        item_serial_code,
        client_name,
        serial_number,
        model_code,
        model_name,
        station_code,
        station_name,
        location,
        note,
        item
        } = payload;

        /**
         * 1️⃣ NONAKTIFKAN DATA LAMA
         *    (item_serial_code + client_name + b_mapping = false)
         */
        await trx("sync.t_m_sync_terminal")
        .where({
            // item_serial_code,
            serial_number,
            // client_name,
            b_mapping: false,
            b_active: true
        })
        .update({
            b_active: false
        });

        /**
         * 2️⃣ INSERT DATA BARU
         */
        const [result] = await trx("sync.t_m_sync_terminal")
        .insert({
            item_serial_code,
            client_name,
            model_code,
            model_name,
            station_code,
            station_name,
            location,
            note,
            item: JSON.stringify(item),
            d_sync: trx.fn.now(),
            b_mapping: false,
            b_active: true,
            n_created_by: createdBy,
            c_signature: signature,
            serial_number,
            c_project: 'KCI'
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
        code: "2300",
        message: "Failed to insert sync terminal data",
        data: err
        };
    }
};
