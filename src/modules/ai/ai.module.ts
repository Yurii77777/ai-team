import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiController } from './ai.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
  ],
  controllers: [],
  providers: [AiController],
})
export class AiModule {}
