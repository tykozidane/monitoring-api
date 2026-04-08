import db from "../../config/database.js";

export const mappingTerminalService = async (payload, updatedBy) => {

    const trx = await db.transaction();

    try {

        const {
            c_project,
            c_terminal_01,
            c_station,
            c_terminal_sn,
            n_terminal_name,
            c_signature,
            i_sync_id,
            c_model_code,
            c_model_name,
            c_item_serial_code,
            devices = []
        } = payload;

        /* =========================
            1️⃣ UPDATE TERMINAL
        ========================== */
        const terminal = await trx("master.t_m_terminal")
            .whereNull("d_deleted_at")
            .andWhere({ c_project, c_terminal_01, c_station })
            .first();

        if (!terminal) {
            throw {
                code: "4040",
                message: "Terminal tidak ditemukan"
            };
        }

        await trx("master.t_m_terminal")
            .where({ i_id: terminal.i_id })
            .update({
                c_terminal_sn,
                n_terminal_name,
                c_signature,
                i_sync_id,
                c_model_code,
                c_model_name,
                c_item_serial_code,
                d_updated_at: trx.fn.now(),
                n_updated_by: updatedBy
            });

        /* =========================
            2️⃣ DEVICE SYNC
        ========================== */

        // Ambil device existing
        const existingDevices = await trx("master.t_m_device")
            .where({
                c_project,
                c_terminal_sn
            })
            .whereNull("d_deleted_at");

        const existingSerials = existingDevices.map(d => d.c_serial_number);
        const bodySerials = devices.map(d => d.c_serial_number);

        /* -------- INSERT & UPDATE -------- */
        for (const dev of devices) {

            const exist = existingDevices.find(
                d => d.c_serial_number === dev.c_serial_number
            );

            if (!exist) {
                // INSERT
                await trx("master.t_m_device").insert({
                    c_device: dev.c_device,
                    c_serial_number: dev.c_serial_number,
                    c_device_type: dev.c_device_type,
                    c_direction: dev.c_direction,
                    n_device_name: dev.n_device_name,
                    sub_item_type: dev.sub_item_type,
                    sub_item_code: dev.sub_item_code,
                    sub_item_serial_code: dev.sub_item_serial_code,
                    c_project,
                    c_terminal_sn,
                    b_active: dev.b_active,
                    n_created_by: updatedBy
                });
                console.log(`Insert device ${dev.c_serial_number}`);
            } else {
                // UPDATE
                console.log(`Update device ${dev.c_serial_number}`);
                await trx("master.t_m_device")
                    .where({ c_serial_number: exist.c_serial_number })
                    .update({
                        c_device: dev.c_device,
                        c_device_type: dev.c_device_type,
                        c_direction: dev.c_direction,
                        n_device_name: dev.n_device_name,
                        sub_item_type: dev.sub_item_type,
                        sub_item_code: dev.sub_item_code,
                        sub_item_serial_code: dev.sub_item_serial_code,
                        b_active: dev.b_active,
                        d_updated_at: trx.fn.now(),
                        n_updated_by: updatedBy
                    });
            }
        }

        /* -------- NON ACTIVE DEVICE -------- */
        for (const exist of existingDevices) {

            if (!bodySerials.includes(exist.c_serial_number)) {
                console.log(`Non active device ${exist.c_serial_number}`);
                await trx("master.t_m_device")
                    .where({ i_id: exist.i_id })
                    .update({
                        b_active: false,
                        d_updated_at: trx.fn.now(),
                        n_updated_by: updatedBy
                    });
            }
        }
        await trx("sync.t_m_sync_terminal")
            .where({i_id : i_sync_id, c_project, serial_number : c_terminal_sn})
            .update({
                b_mapping: false,
            });
        await trx.commit();

        return {
            code: 0,
            message: "Mapping terminal berhasil"
        };

    } catch (err) {

        await trx.rollback();

        return {
            code: err.code || "4500",
            message: err.message || "Failed mapping terminal",
            data: err
        };
    }
};
