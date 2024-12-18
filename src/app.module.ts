import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users/users.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available everywhere
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>(`DB_${process.env.NODE_ENV}_HOST`),
        port: configService.get<number>(`DB_PORT`),
        database: configService.get<string>('DB_NAME'),
        username: configService.get<string>(
          `DB_${process.env.NODE_ENV}_USERNAME`,
        ),
        password: configService.get<string>(
          `DB_${process.env.NODE_ENV}_PASSWORD`,
        ),
        entities: [Users],
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
