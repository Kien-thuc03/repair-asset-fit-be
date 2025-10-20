import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmAsyncConfig } from "./common/config/typeorm.config";
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './modules/redis/redis.module';
import { UnitsModule } from './modules/units/units.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RepairsModule } from './modules/repairs/repairs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync(TypeOrmAsyncConfig),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 10000,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 10000,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 10000,
      },
    ]),
    AuthModule,
    UsersModule,
    RedisModule,
    UnitsModule,
    RoomsModule,
    RolesModule,
    PermissionsModule,
    RepairsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [],
})
export class AppModule {}