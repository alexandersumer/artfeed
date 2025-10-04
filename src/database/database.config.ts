import { registerAs } from "@nestjs/config";
import { DataSourceOptions } from "typeorm";

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }
  return ["true", "1", "yes"].includes(value.toLowerCase());
};

export default registerAs(
  "database",
  (): DataSourceOptions & { autoSync: boolean } => {
    const config = {
      type: (process.env.DB_TYPE as DataSourceOptions["type"]) || "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "artfeed",
      password: process.env.DB_PASSWORD || "artfeed",
      database: process.env.DB_NAME || "artfeed",
      ssl: parseBoolean(process.env.DB_SSL, false)
        ? { rejectUnauthorized: false }
        : undefined,
      autoSync: parseBoolean(process.env.DB_AUTO_SYNC, false),
    } as DataSourceOptions & { autoSync: boolean };

    return config;
  },
);
