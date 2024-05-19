import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostService } from './posts.service';
import { Post } from '../../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [],
  providers: [PostService],
  exports: [PostService],
})
export class PostsModule {}
