import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  node: process.env.ELASTIC_URL,
  auth: {
    username: process.env.ELASTIC_USER,
    password: process.env.ELASTIC_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export default client;
