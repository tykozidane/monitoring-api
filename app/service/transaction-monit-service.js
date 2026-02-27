import elasticClient from "../config/elastic.js";

export const saveTransactionMonitoringService = async (payload) => {
    try {
        const { c_project, c_terminal_sn, Data } = payload;

        if (!Array.isArray(Data) || Data.length === 0) {
            throw {
                code: "4000",
                message: "Data array is required"
            };
        }

        const indexName = "transaction-monitoring";

        const bulkBody = [];

        for (const trx of Data) {

            // Action
            bulkBody.push({
                create: {
                    _index: indexName,
                    _id: `${c_project}:${trx.id}`   // 🔥 scoped uniqueness
                }
                });

            // Document
            bulkBody.push({
                c_project,
                c_terminal_sn,
                ...trx,
                created_at: new Date().toISOString()
            });
        }

        const bulkResponse = await elasticClient.bulk({
            refresh: false,
            body: bulkBody
        });

        let successCount = 0;
        let duplicateCount = 0;
        let failedCount = 0;

        if (bulkResponse.errors) {
            for (const item of bulkResponse.items) {
                const action = item.create;

                if (action.status === 201) {
                    successCount++;
                } else if (action.status === 409) {
                    // 🔥 Duplicate -> Ignore
                    duplicateCount++;
                } else {
                    failedCount++;
                }
            }
        } else {
            successCount = Data.length;
        }

        return {
            code: 0,
            message: {
                total_sent: Data.length,
                inserted: successCount,
                duplicate: duplicateCount,
                failed: failedCount
            }
        };

    } catch (err) {
        return {
            code: err.code || "5000",
            message: err.message || "Failed to bulk insert transaction",
            data: err
        };
    }
};