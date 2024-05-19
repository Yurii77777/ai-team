import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TelegramModule } from './modules/telegram/telegram.module';
import { PostsModule } from './modules/posts/posts.module';
import { AiModule } from './modules/ai/ai.module';

import typeOrmConfig from './config/ormConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    TelegramModule,
    PostsModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
