import cron from "node-cron";
import db from "../config/database.js";
import { saveElasticMonitoringService } from "../service/data-monit-server-service.js";

/**
 * Cron Monitoring Server
 * run every 1 minute
 */

export const startMonitoringServerCron = () => {

    cron.schedule("30 * * * * *", async () => {

        console.log("Running server monitoring cron:", new Date().toISOString());

        try {

            /* =============================
                1️⃣ GET ALL ACTIVE SERVERS
            ============================== */

            const servers = await db("master.t_m_server")
                .where("b_active", true);

            if (!servers.length) {
                console.log("No active servers found");
                return;
            }

            /* =============================
                2️⃣ LOOP EACH SERVER
            ============================== */

            for (const server of servers) {

                try {

                    await saveElasticMonitoringService({
                        c_server: server.c_server
                    });

                    console.log(`Monitoring success: ${server.c_server}`);

                } catch (err) {

                    console.error(`Monitoring failed for ${server.c_server}`, err);

                }

            }

        } catch (err) {

            console.error("Monitoring cron error:", err);

        }

    });

};