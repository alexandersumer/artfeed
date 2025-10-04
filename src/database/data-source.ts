import "dotenv/config";
import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import path from "node:path";
import databaseConfig from "./database.config";

const resolvedConfig = databaseConfig();
const { autoSync, ...options } = resolvedConfig;
void autoSync;

const rootDir = path.resolve(__dirname, "..", "..");

const dataSourceOptions: DataSourceOptions = {
  ...(options as DataSourceOptions),
  synchronize: false,
  migrationsRun: false,
  entities: [
    path.join(rootDir, "dist/**/*.entity.js"),
    path.join(rootDir, "src/**/*.entity.ts"),
  ],
  migrations: [
    path.join(rootDir, "dist/database/migrations/*.js"),
    path.join(rootDir, "src/database/migrations/*.ts"),
  ],
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
