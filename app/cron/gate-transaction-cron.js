import cron from "node-cron";
import pLimit from "p-limit";

import db from "../config/database.js";

import { decrypt } from "../utils/crypto.js";

import { createDynamicConnection }
    from "../utils/dynamic-db.js";

/* =========================================================
    CONFIG
========================================================= */

const limit = pLimit(3);

let isRunning = false;

/* =========================================================
    DATE HELPER
========================================================= */

const getTransactionDate = () => {

    const now = new Date();

    const yesterday =
        new Date(now);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const yyyy =
        yesterday.getFullYear();

    const mm =
        String(
            yesterday.getMonth() + 1
        ).padStart(2, "0");

    const dd =
        String(
            yesterday.getDate()
        ).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
};

const getDateRange = () => {

    const now = new Date();

    const yesterday =
        new Date(now);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const yyyy =
        yesterday.getFullYear();

    const mm =
        String(
            yesterday.getMonth() + 1
        ).padStart(2, "0");

    const dd =
        String(
            yesterday.getDate()
        ).padStart(2, "0");

    return {
        startDate:
            `${yyyy}-${mm}-${dd} 03:00:00`,

        endDate:
            `${now.getFullYear()}-${
                String(
                    now.getMonth() + 1
                ).padStart(2, "0")
            }-${
                String(
                    now.getDate()
                ).padStart(2, "0")
            } 02:59:59`
    };
};

/* =========================================================
    PROCESS STATION
========================================================= */

const processStation = async (
    station,
    trxDate,
    startDate,
    endDate
) => {

    let dynamicDb = null;

    try {

        console.log(
            `🚀 Processing station ${station.c_station}`
        );

        /* =================================================
            CHECK EXIST
        ================================================= */

        const existing =
            await db(
                "opr.t_d_transaction_recap"
            )
            .where({
                c_project: station.c_project,
                c_station: station.c_station,
                d_transaction: trxDate
            })
            .first();

        if (existing) {

            console.log(
                `⚠️ Skip ${station.c_station}, already exists`
            );

            return;
        }

        /* =================================================
            CREATE CONNECTION
        ================================================= */

        const password =
            decrypt(
                station.e_password_postgresql
            );

        dynamicDb =
            createDynamicConnection({
                host: station.ip_address,
                port: 5432,
                user:
                    station.n_username_postgresql,
                password,
                database: station.n_database_name
            });

        /* =================================================
            GATE OUT
        ================================================= */

        const gateOut =
            await dynamicDb.raw(`
                SELECT
                    tdgo.c_gate_out AS c_terminal,
                    COUNT(*)::bigint AS total_vol
                FROM ctm.t_d_gate_out tdgo
                WHERE
                    tdgo.d_gate_out
                        BETWEEN ? AND ?
                    AND tdgo.c_status = 'S'
                GROUP BY tdgo.c_gate_out
            `, [
                startDate,
                endDate
            ]);

        /* =================================================
            GATE IN
        ================================================= */

        const gateIn =
            await dynamicDb.raw(`
                SELECT
                    tdgi.c_gate AS c_terminal,
                    COUNT(*)::bigint AS total_vol
                FROM ctm.t_d_gate_in tdgi
                WHERE
                    tdgi.d_gate_in
                        BETWEEN ? AND ?
                    AND tdgi.c_status = 'S'
                GROUP BY tdgi.c_gate
            `, [
                startDate,
                endDate
            ]);

        /* =================================================
            COMBINE DATA
        ================================================= */

        const combined = [
            ...gateOut.rows,
            ...gateIn.rows
        ];

        if (!combined.length) {

            console.log(
                `⚠️ No transaction ${station.c_station}`
            );

            return;
        }

        /* =================================================
            INSERT BULK
        ================================================= */

        const insertData =
            combined.map(item => ({
                c_project:
                    station.c_project,

                c_station:
                    station.c_station,

                c_terminal:
                    item.c_terminal,

                d_transaction:
                    trxDate,

                c_status: "S",

                i_volume:
                    Number(item.total_vol)
            }));

        await db(
            "opr.t_d_transaction_recap"
        )
        .insert(insertData)
        .onConflict([
            "d_transaction",
            "c_project",
            "c_station",
            "c_terminal"
        ])
        .ignore();

        console.log(
            `✅ Done ${station.c_station}`
        );

    } catch (err) {

        console.error(
            `❌ Error station ${station.c_station}`,
            err
        );

    } finally {

        if (dynamicDb) {

            await dynamicDb.destroy();
        }
    }
};

/* =========================================================
    MAIN PROCESS
========================================================= */

export const runGateTransactionCron =
async () => {

    if (isRunning) {

        console.log(
            "⚠️ Previous transaction cron still running"
        );

        return;
    }

    isRunning = true;

    try {

        console.log(
            "🚀 Running gate transaction cron"
        );

        const trxDate =
            getTransactionDate();

        const {
            startDate,
            endDate
        } = getDateRange();

        /* =================================================
            GET STATION
        ================================================= */

        const stations =
            await db("config.t_d_station")
            .where("b_active", true)
            .whereNotNull("ip_address")
            .whereNotNull(
                "n_username_postgresql"
            )
            .whereNotNull(
                "e_password_postgresql"
            );

        if (!stations.length) {

            console.log(
                "⚠️ No station found"
            );

            return;
        }

        /* =================================================
            PROCESS WITH LIMIT
        ================================================= */

        await Promise.all(
            stations.map(station =>
                limit(() =>
                    processStation(
                        station,
                        trxDate,
                        startDate,
                        endDate
                    )
                )
            )
        );

        console.log(
            "✅ Gate transaction cron done"
        );

    } catch (err) {

        console.error(
            "❌ Gate transaction cron failed",
            err
        );

    } finally {

        isRunning = false;
    }
};

/* =========================================================
    CRON SCHEDULER
========================================================= */

/*
    every 1 hour
    minute 10
*/

cron.schedule(
    "0 * * * * *",
    async () => {

        await runGateTransactionCron();
    },
    {
        timezone: "Asia/Jakarta"
    }
);

console.log(
    "🕒 Gate transaction cron loaded"
);