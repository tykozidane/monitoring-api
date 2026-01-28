import { Client } from "@elastic/elasticsearch";

const elasticClient = new Client({
    node: "http://192.168.1.12:9200", // sesuai token kamu
    auth: {
        username: "elastic",
        password: "Ii=ffEq4fUzSsrSIdmEs"
    }
});

export default elasticClient;
