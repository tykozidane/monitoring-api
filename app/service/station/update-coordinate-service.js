import db from "../../config/database.js";

export const updateStationCoordinateService = async (payload, updatedBy) => {
    const trx = await db.transaction();

    try {
        const { c_project, c_station, n_lat, n_lng } = payload;

        if (!c_project || !c_station) {
            throw {
                code: "4000",
                message: "c_project and c_station are required"
            };
        }

        // validasi lat lng (optional tapi recommended)
        if (n_lat && isNaN(parseFloat(n_lat))) {
            throw {
                code: "4001",
                message: "Invalid n_lat"
            };
        }

        if (n_lng && isNaN(parseFloat(n_lng))) {
            throw {
                code: "4002",
                message: "Invalid n_lng"
            };
        }

        /* =========================
            1️⃣ CEK STATION
        ========================== */
        const station = await trx("config.t_d_station")
            .where("c_project", c_project)
            .andWhereRaw("TRIM(c_station) = TRIM(?)", [c_station])
            .where("b_active", true)
            .whereNull("d_deleted_at")
            .first();

        if (!station) {
            throw {
                code: "4040",
                message: "Station not found"
            };
        }

        /* =========================
            2️⃣ UPDATE
        ========================== */
        await trx("config.t_d_station")
            .where("i_id", station.i_id)
            .update({
                n_lat: n_lat ?? station.n_lat,
                n_lng: n_lng ?? station.n_lng,
                d_updated_at: trx.fn.now(),
                n_updated_by: updatedBy
            });

        await trx.commit();

        return {
            code: 0,
            message: "Station coordinate updated successfully"
        };

    } catch (err) {
        await trx.rollback();

        return {
            code: err.code || "5000",
            message: err.message || "Failed to update station coordinate",
            data: err
        };
    }
};