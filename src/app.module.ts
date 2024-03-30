import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TelegramModule } from './modules/telegram/telegram.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TelegramModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
