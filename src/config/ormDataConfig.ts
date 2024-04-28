import { DataSource } from 'typeorm';
import { typeOrmOptions } from './ormConfig';

const ormDataSourceConfig = new DataSource({
  type: 'postgres',
  ...typeOrmOptions,
  entities: ['src/entities/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/**{.ts,.js}'],
});

export default ormDataSourceConfig;
