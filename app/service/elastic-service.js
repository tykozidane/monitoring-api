import elasticClient from "../config/elastic.js";

export const indexMonitoringData = async (doc) => {
    try {
        const save = await elasticClient.index({
            index: "monitoring-data",
            document: doc
        });
        console.log("Document saved to Elasticsearch:", save);
    } catch (err) {
        console.error("Elastic insert error:", err.meta?.body || err);
        // ❗ jangan throw → elastic tidak boleh bikin API gagal
    }
};
