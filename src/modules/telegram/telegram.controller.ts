import { Command, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { AiController } from '../ai/ai.controller';

import { COMMANDS } from './telegram.commands';
import { BOT_MESSAGES } from './telegram.messages';

import { Role } from 'src/types/ai.types';

import { ASSISTANT_NAME } from 'src/config/ai.config';

@Update()
export class TelegramController {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly aiController: AiController,
  ) {
    this.bot.telegram.setMyCommands(COMMANDS);
  }

  @Start()
  async startCommand(ctx): Promise<any> {
    try {
      await ctx.reply(BOT_MESSAGES.NEW_USER_GREETING);
    } catch (error) {
      console.log('Тут шляпа ::: ', error);
    }

    // const chatID = ctx?.update?.message?.from?.id;
  }

  @Command('create_post')
  async createPost(ctx): Promise<any> {
    try {
      const smmManager = await this.aiController.initializeSMMmanager();

      const threadForSMMmanager = await this.aiController.createThread();
      await this.aiController.addMessageToThread({
        threadId: threadForSMMmanager.id,
        message: {
          role: Role.User,
          content: BOT_MESSAGES.COMMANDS_FOR_AI.GENERATE_THEMES,
        },
      });

      // Response to bot's admin
      await ctx.reply(BOT_MESSAGES.TASK_ADDED);

      const themesForPost = await this.aiController.runAssistant({
        threadId: threadForSMMmanager.id,
        assistantId: smmManager.id,
      });

      if (!themesForPost) {
        return await ctx.reply(
          BOT_MESSAGES.ERROR.SMM_MANAGER.replace(
            '{assistant_name}',
            ASSISTANT_NAME.SMM_MANAGER,
          ),
        );
      }

      await this.aiController.addMessageToThread({
        threadId: threadForSMMmanager.id,
        message: {
          role: Role.Assistant,
          content: themesForPost,
        },
      });

      // Handlers for Head of Department
      const headOfDepartment =
        await this.aiController.initializeHeadOfDepartment();
      const threadForHeadOfDepartment = await this.aiController.createThread();

      const themesToChoose =
        BOT_MESSAGES.RESULT_FROM_SMM.replace(
          '{assistant_name}',
          ASSISTANT_NAME.SMM_MANAGER,
        ) + themesForPost;

      await ctx.reply(themesToChoose);

      await this.aiController.addMessageToThread({
        threadId: threadForHeadOfDepartment.id,
        message: {
          role: Role.User,
          content: themesToChoose,
        },
      });

      const resultFromHeadOfDepartment = await this.aiController.runAssistant({
        threadId: threadForHeadOfDepartment.id,
        assistantId: headOfDepartment.id,
      });

      const resultFromHeadOfDepartmentMessageToUser =
        BOT_MESSAGES.RESULT_FROM_HEAD.replace(
          '{assistant_name}',
          ASSISTANT_NAME.HEAD_OF_DEPARTMENT,
        ) + resultFromHeadOfDepartment;
      await ctx.reply(resultFromHeadOfDepartmentMessageToUser);

      // Handlers for Content Manager
      const contentManager = await this.aiController.initializeContentManager();
      const threadForContentManager = await this.aiController.createThread();

      const themeToCreateContent =
        BOT_MESSAGES.COMMANDS_FOR_AI.CREATE_CONTENT +
        resultFromHeadOfDepartment;

      await this.aiController.addMessageToThread({
        threadId: threadForContentManager.id,
        message: {
          role: Role.User,
          content: themeToCreateContent,
        },
      });

      const resultFromContentManager = await this.aiController.runAssistant({
        threadId: threadForContentManager.id,
        assistantId: contentManager.id,
      });

      await ctx.reply(resultFromContentManager);
    } catch (error) {
      console.log('ERROR createPost :::', error);
    }
  }
}
