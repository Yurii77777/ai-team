import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { FindPostsDto } from './dto/find-posts.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAllPosts(findPostsDto: FindPostsDto): Promise<Post[]> {
    try {
      return await this.postRepository.find({ where: findPostsDto });
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async findManyByTitles(titles: string[]): Promise<Post[]> {
    try {
      return this.postRepository.find({ where: { title: In(titles) } });
    } catch (error) {
      throw new NotFoundException(error);
    }
  }

  async createMany(createPostDto: CreatePostDto[]): Promise<Post[]> {
    const posts = this.postRepository.create(createPostDto);
    return this.postRepository.save(posts);
  }

  async updateOne(updateDto: UpdatePostDto) {
    const { title, update } = updateDto;
    try {
      const post = await this.postRepository.findOne({ where: { title } });

      if (!post) {
        throw new BadRequestException('There is no such post!');
      }

      return this.postRepository.save({
        id: post.id,
        isPosted: update.isPosted,
      });
    } catch (error) {
      throw new NotFoundException(error);
    }
  }
}
