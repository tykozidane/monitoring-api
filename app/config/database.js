import knex from "knex";
import 'dotenv/config'
const db = knex({
    client: 'pg',
    debug: false,
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || '5432',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    }
});

export default db;
