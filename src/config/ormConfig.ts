import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config({ path: `.env.${process.env}` });

export const typeOrmOptions = {
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  ssl: process.env.SSL === 'true',
};

const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  ...typeOrmOptions,
  entities: [__dirname + 'src/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + 'src/database/migrations/**{.ts,.js}'],
  autoLoadEntities: true,
};

export default typeOrmConfig;
