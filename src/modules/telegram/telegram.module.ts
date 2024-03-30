import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';

import { TelegramController } from './telegram.controller';
import { AiController } from '../ai/ai.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TelegrafModule.forRoot({
      middlewares: [session()],
      token: process.env.TELEGRAM_BOT_TOKEN,
    }),
  ],
  controllers: [],
  providers: [TelegramController, AiController],
})
export class TelegramModule {}
