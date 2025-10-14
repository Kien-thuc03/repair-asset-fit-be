import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { User } from "src/entities/user.entity";
import { RepairRequest } from "src/entities/repair-request.entity";
import { Technician } from "src/entities/technician.entity";
import { RepairCategory } from "src/entities/repair-category.entity";
import { FileUrl } from "src/entities/file-url.entity";
import { Notification } from "src/entities/notification.entity";

export const TypeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [],
  useFactory: (): TypeOrmModuleOptions => {
    return {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "repair_asset_fit",
      // Connection pool configuration
      extra: {
        connectionLimit: 5,
        acquireTimeout: 30000,
        timeout: 30000,
        reconnect: true,
        multipleStatements: false,
        idleTimeout: 300000,
        maxReconnects: 3,
        reconnectDelay: 2000,
      },
      entities: [
        User,
        RepairRequest,
        Technician,
        RepairCategory,
        FileUrl,
        Notification
      ],
      synchronize: false,
      logging: false,
      migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
      migrationsTableName: "typeorm_migrations",
    };
  },
  inject: [],
};

const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "repair_asset_fit",
  extra: {
    connectionLimit: 3,
    acquireTimeout: 20000,
    timeout: 20000,
  },
  entities: [
    User,
    RepairRequest,
    Technician,
    RepairCategory,
    FileUrl,
    Notification
  ],
  migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
  migrationsTableName: "typeorm_migrations",
});

export default dataSource;