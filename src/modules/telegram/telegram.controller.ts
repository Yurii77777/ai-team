import { Command, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { AiController } from '../ai/ai.controller';

import { COMMANDS } from './telegram.commands';
import { BOT_MESSAGES } from './telegram.messages';

import { Role, Tool } from 'src/types/ai.types';

import {
  ASSISTANT_NAME,
  BASE_INSTRUCTIONS,
  OPENAI_MODEL,
} from 'src/config/ai.config';

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
      // SMM manager
      const smmManager = await this.aiController.initializeAssistant({
        name: ASSISTANT_NAME.SMM_MANAGER,
        instructions: BASE_INSTRUCTIONS.SMM_MANAGER,
        tools: [{ type: Tool.CODE_INTERPRETER }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });

      const smmManagerThread = await this.aiController.createThread();
      await this.aiController.addMessageToThread({
        threadId: smmManagerThread.id,
        message: {
          role: Role.User,
          content: BOT_MESSAGES.COMMANDS_FOR_AI.GENERATE_THEMES,
        },
      });

      // Response to bot's admin
      await ctx.reply(BOT_MESSAGES.TASK_ADDED);

      const generatedThemes = await this.aiController.runAssistant({
        threadId: smmManagerThread.id,
        assistantId: smmManager.id,
      });

      if (!generatedThemes) {
        return await ctx.reply(
          BOT_MESSAGES.ERROR.SMM_MANAGER.replace(
            '{assistant_name}',
            ASSISTANT_NAME.SMM_MANAGER,
          ),
        );
      }

      await this.aiController.addMessageToThread({
        threadId: smmManagerThread.id,
        message: {
          role: Role.Assistant,
          content: generatedThemes,
        },
      });

      // Head of Department
      const headOfDepartment = await this.aiController.initializeAssistant({
        name: ASSISTANT_NAME.HEAD_OF_DEPARTMENT,
        instructions: BASE_INSTRUCTIONS.HEAD_OF_DEPARTMENT,
        tools: [{ type: Tool.CODE_INTERPRETER }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });

      const headOfDepartmentThread = await this.aiController.createThread();

      const themesToChoose =
        BOT_MESSAGES.RESULT_FROM_SMM.replace(
          '{assistant_name}',
          ASSISTANT_NAME.SMM_MANAGER,
        ) + generatedThemes;

      await this.aiController.addMessageToThread({
        threadId: headOfDepartmentThread.id,
        message: {
          role: Role.User,
          content: themesToChoose,
        },
      });

      const headOfDepartmentResult = await this.aiController.runAssistant({
        threadId: headOfDepartmentThread.id,
        assistantId: headOfDepartment.id,
      });

      if (!headOfDepartmentResult) {
        return await ctx.reply(
          BOT_MESSAGES.ERROR.HEAD_OF_DEPARTMENT.replace(
            '{assistant_name}',
            ASSISTANT_NAME.HEAD_OF_DEPARTMENT,
          ),
        );
      }

      // Content Manager
      const contentManager = await this.aiController.initializeAssistant({
        name: ASSISTANT_NAME.CONTENT_MANAGER,
        instructions: BASE_INSTRUCTIONS.CONTENT_MANAGER,
        tools: [{ type: Tool.CODE_INTERPRETER }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });

      const contentManagerThread = await this.aiController.createThread();

      const themeToCreateContent =
        BOT_MESSAGES.COMMANDS_FOR_AI.CREATE_CONTENT + headOfDepartmentResult;

      await this.aiController.addMessageToThread({
        threadId: contentManagerThread.id,
        message: {
          role: Role.User,
          content: themeToCreateContent,
        },
      });

      const contentManagerResult = await this.aiController.runAssistant({
        threadId: contentManagerThread.id,
        assistantId: contentManager.id,
      });

      if (!contentManagerResult) {
        return await ctx.reply(
          BOT_MESSAGES.ERROR.CONTENT_MANAGER.replace(
            '{assistant_name}',
            ASSISTANT_NAME.CONTENT_MANAGER,
          ),
        );
      }

      // Chief Editor
      const chiefEditor = await this.aiController.initializeAssistant({
        name: ASSISTANT_NAME.CHIEF_EDITOR,
        instructions: BASE_INSTRUCTIONS.CHIEF_EDITOR,
        tools: [{ type: Tool.CODE_INTERPRETER }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });

      const chiefEditorThread = await this.aiController.createThread();
      await this.aiController.addMessageToThread({
        threadId: chiefEditorThread.id,
        message: {
          role: Role.User,
          content: contentManagerResult,
        },
      });

      const chiefEditorResult = await this.aiController.runAssistant({
        threadId: chiefEditorThread.id,
        assistantId: chiefEditor.id,
      });

      if (!chiefEditorResult) {
        return await ctx.reply(
          BOT_MESSAGES.ERROR.CHIEF_EDITOR.replace(
            '{assistant_name}',
            ASSISTANT_NAME.CHIEF_EDITOR,
          ),
        );
      }

      const post = await ctx.telegram.sendMessage(
        process.env.TELEGRAM_PUBLIC_CHANNEL,
        chiefEditorResult,
        {
          // TODO: Check Telegram decorators for parce mode
          parse_mode: 'html',
        },
      );

      if (!post) {
        return await ctx.reply(BOT_MESSAGES.ERROR.POST_WAS_NOT_ADDED);
      }

      const postUrl =
        'https://t.me/' +
        process.env.TELEGRAM_PUBLIC_CHANNEL.replace('@', '') +
        '/' +
        post.message_id;

      const messageToReply = BOT_MESSAGES.POST_MESSAGE.replace(
        '{theme}',
        headOfDepartmentResult,
      ).replace('{URL}', `<a href="${postUrl}">посиланням</a>`);

      await ctx.reply(messageToReply),
        {
          parse_mode: 'html',
        };
    } catch (error) {
      console.log('ERROR createPost :::', error);
    }
  }
}
