import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramUtils } from './telegram.utils';
import { AiController } from '../ai/ai.controller';
import { PostService } from '../posts/posts.service';
import { Post } from '../../entities/post.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TelegrafModule.forRoot({
      middlewares: [session()],
      token: process.env.TELEGRAM_BOT_TOKEN,
      options: {
        handlerTimeout: 9_000_000,
      },
    }),
    TypeOrmModule.forFeature([Post]),
  ],
  controllers: [],
  providers: [
    TelegramController,
    TelegramService,
    PostService,
    TelegramUtils,
    AiController,
  ],
})
export class TelegramModule {}
