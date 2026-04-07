import db from "../config/database.js";
import elasticClient from "../config/elasticsearch.js";
import { createDynamicConnection } from "../utils/dynamic-db.js";
function getMinuteTimestamp() {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    const iso = now.toISOString().replace("T", " ").replace("Z", "");
    return iso.split(".")[0] + ".000";
}

export const saveElasticMonitoringService = async (payload) => {

    try {

        const { c_server, time } = payload;

        /* ===============================
            1️⃣ GET SERVER CONFIG
        =============================== */

        const server = await db("master.t_m_server")
            .where({
                c_server,
                b_active: true
            })
            .first();

        if (!server) {
            throw {
                code: "4040",
                message: "Server configuration not found"
            };
        }

        /* ===============================
            2️⃣ CREATE DYNAMIC CONNECTION
        =============================== */

        const dynamicDB = createDynamicConnection(server);

        const monitoringTime = time || getMinuteTimestamp();

        /* ===============================
            3️⃣ RUN QUERY MONITORING
        =============================== */

        const queryMonitoring = `
        SELECT
        (
            jsonb_build_object(
                '@timestamp', time,
                'host', host,
                'source', source
            )
            ||
            jsonb_object_agg(metric, device_metrics)
        ) AS elastic_doc
        FROM (
            SELECT
                time,
                tags->>'host' AS host,
                tags->>'source' AS source,
                key AS metric,
                jsonb_object_agg(
                    COALESCE(tags->>'label', tags->>'sensor', tags->>'device', 'default'),
                    value::numeric
                ) AS device_metrics
            FROM prometheus
            CROSS JOIN jsonb_each_text(fields)
            WHERE time = ?
            GROUP BY
                time,
                tags->>'host',
                tags->>'source',
                key
        ) t
        GROUP BY
            time,
            host,
            source
        `;

        const result = await dynamicDB.raw(queryMonitoring, [monitoringTime]);

        const docs = result.rows;
        console.log(`Fetched ${docs.length} monitoring documents for ${monitoringTime}`);
        if (!docs.length) {
            return {
                code: 404,
                message: "No monitoring data found"
            };
        }

        /* ===============================
            4️⃣ SAVE TO ELASTIC
        =============================== */

        const indexName = "server-monitoring";

        for (const row of docs) {

            const doc = row.elastic_doc;
            const BYTES_TO_MB = 1024 * 1024;

            for (const metric in doc) {

                if (typeof doc[metric] === "object") {

                    for (const label in doc[metric]) {

                        let value = Number(doc[metric][label]);

                        if (!isNaN(value)) {

                            // convert specific metric
                            if (metric === "process_virtual_memory_max_bytes") {

                                const newMetric = "process_virtual_memory_max_mb";

                                doc[newMetric] = {};

                                for (const label in doc[metric]) {
                                    doc[newMetric][label] = doc[metric][label] / BYTES_TO_MB;
                                }

                                delete doc[metric];
                            }
                        }
                    }
                }
            }

            const id = `${doc.host}_${doc.source}_${doc['@timestamp']}`;

            await elasticClient.index({
                index: indexName,
                id,
                document: doc
            });

        }

        /* ===============================
            5️⃣ COUNT UNIQUE FIELDS
        =============================== */

        const fieldQuery = `
        SELECT COUNT(DISTINCT key) AS total_unique_fields
        FROM prometheus
        CROSS JOIN jsonb_each(fields)
        WHERE time = ?
        `;

        const fieldCount = await dynamicDB.raw(fieldQuery, [monitoringTime]);

        const totalUniqueFields = fieldCount.rows[0].total_unique_fields;

        const metricFields = Object.keys(docs[0].elastic_doc)
            .filter(k => !["@timestamp", "host", "source"].includes(k));

        const totalMetricFields = metricFields.length;

        await dynamicDB.destroy();

        return {
            code: 0,
            message: {
                total_documents: docs.length,
                total_metric_fields: totalMetricFields,
                total_unique_fields: totalUniqueFields
            }
        };

    } catch (err) {

        return {
            code: "5000",
            message: "Failed to process monitoring",
            data: err
        };

    }
};