import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { ArtworksModule } from './artworks/artworks.module';
import { FeedModule } from './feed/feed.module';
import { InteractionsModule } from './interactions/interactions.module';
import { UsersModule } from './users/users.module';
import databaseConfig from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseConfig = configService.get<DataSourceOptions & { autoSync: boolean }>('database');
        if (!databaseConfig) {
          throw new Error('Database configuration is missing');
        }
        const { autoSync, ...options } = databaseConfig;
        return {
          ...(options as DataSourceOptions),
          autoLoadEntities: true,
          synchronize: autoSync,
        };
      },
    }),
    UsersModule,
    ArtworksModule,
    FeedModule,
    InteractionsModule,
  ],
})
export class AppModule {}
