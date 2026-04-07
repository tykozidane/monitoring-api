import knex from "knex";

export const createDynamicConnection = (serverConfig) => {

    return knex({
        client: "pg",
        connection: {
            host: serverConfig.p_host,
            port: serverConfig.p_port,
            user: serverConfig.p_username,
            password: serverConfig.p_password,
            database: serverConfig.p_database
        },
        pool: { min: 0, max: 5 }
    });

};