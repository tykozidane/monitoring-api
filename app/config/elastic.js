import { Client } from "@elastic/elasticsearch";

const elasticClient = new Client({
    node: "https://192.168.62.90:9200", // sesuai token kamu
    auth: {
        username: "elastic",
        password: "htvOCTKq2ZrxQO0FgQcI"
    },
    tls: {
    rejectUnauthorized: false
    }
});

export default elasticClient;
