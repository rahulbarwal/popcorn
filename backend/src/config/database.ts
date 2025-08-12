import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

const config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "inventory_dashboard",
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "../migrations",
  },
  seeds: {
    directory: "../seeds",
  },
};

const db = knex(config);

export default db;
