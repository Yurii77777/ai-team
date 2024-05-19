import { Injectable } from '@nestjs/common';

import { PostService } from '../posts/posts.service';

import { Post } from 'src/entities/post.entity';
import { FindPostsDto } from '../posts/dto/find-posts.dto';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { UpdatePostDto } from '../posts/dto/update-post.dto';

@Injectable()
export class TelegramService {
  constructor(private readonly postService: PostService) {}

  async getPosts(findPostsDto: FindPostsDto): Promise<Post[]> {
    return this.postService.findAllPosts(findPostsDto);
  }

  async getManyPostsByTitle(titles: string[]): Promise<Post[]> {
    return this.postService.findManyByTitles(titles);
  }

  async createPosts(createPostDto: CreatePostDto[]): Promise<Post[]> {
    return this.postService.createMany(createPostDto);
  }

  async updatePost(updateDto: UpdatePostDto): Promise<Post> {
    return this.postService.updateOne(updateDto);
  }
}
