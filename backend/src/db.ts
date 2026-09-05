import { Pool, PoolConfig } from "pg";
import config from "./config";

const poolConfig: PoolConfig = config.database.url
  ? {
      connectionString: config.database.url,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
    };

export const db = new Pool(poolConfig);