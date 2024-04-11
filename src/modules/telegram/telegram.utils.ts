import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';

import { AiController } from '../ai/ai.controller';

import {
  ASSISTANT_NAME,
  BASE_INSTRUCTIONS,
  OPENAI_MODEL,
} from '../../config/ai.config';
import { BOT_MESSAGES } from './telegram.messages';
import { Role, Tool } from '../../types/ai.types';
import {
  CheckAndUpdatePostParams,
  InitializeAssistantParams,
  RunAssistantParams,
} from '../../types/telegram.types';

import { POST_LENGTH } from '../../constants/common.constant';

@Injectable()
export class TelegramUtils {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly aiController: AiController,
  ) {}

  async createPost(): Promise<{
    success: boolean;
    post: string;
    theme: string;
    postLongVersion: string;
  }> {
    const result = {
      success: false,
      theme: '',
      post: '',
      postLongVersion: '',
    };

    try {
      // initialize SMM manager
      const { assistant: smmManager, assistantThread: smmManagerThread } =
        await this.initializeAssistant({
          name: ASSISTANT_NAME.SMM_MANAGER,
          instructions: BASE_INSTRUCTIONS.SMM_MANAGER,
          tools: [{ type: Tool.CODE_INTERPRETER }],
          model: OPENAI_MODEL.GPT4_LATEST,
        });

      // run SMM manager
      const generatedThemes = await this.runAssistant({
        threadId: smmManagerThread.id,
        assistantId: smmManager.id,
        role: Role.User,
        message: BOT_MESSAGES.COMMANDS_FOR_AI.GENERATE_THEMES,
      });

      if (!generatedThemes) {
        await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_ADMIN_CHAT_ID,
          BOT_MESSAGES.ERROR.SMM_MANAGER.replace(
            '{assistant_name}',
            ASSISTANT_NAME.SMM_MANAGER,
          ),
        );

        return result;
      }

      // initialize Head of Department
      const {
        assistant: headOfDepartment,
        assistantThread: headOfDepartmentThread,
      } = await this.initializeAssistant({
        name: ASSISTANT_NAME.HEAD_OF_DEPARTMENT,
        instructions: BASE_INSTRUCTIONS.HEAD_OF_DEPARTMENT,
        tools: [{ type: Tool.CODE_INTERPRETER }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });

      const themesToChoose =
        BOT_MESSAGES.RESULT_FROM_SMM.replace(
          '{assistant_name}',
          ASSISTANT_NAME.SMM_MANAGER,
        ) + generatedThemes;

      // run Head of Department
      const headOfDepartmentResult = await this.runAssistant({
        threadId: headOfDepartmentThread.id,
        assistantId: headOfDepartment.id,
        role: Role.User,
        message: themesToChoose,
      });

      if (!headOfDepartmentResult) {
        await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_ADMIN_CHAT_ID,
          BOT_MESSAGES.ERROR.HEAD_OF_DEPARTMENT.replace(
            '{assistant_name}',
            ASSISTANT_NAME.HEAD_OF_DEPARTMENT,
          ),
        );

        return result;
      }

      // initialize Content Manager
      const {
        assistant: contentManager,
        assistantThread: contentManagerThread,
      } = await this.initializeAssistant({
        name: ASSISTANT_NAME.CONTENT_MANAGER,
        instructions: BASE_INSTRUCTIONS.CONTENT_MANAGER,
        tools: [{ type: Tool.CODE_INTERPRETER }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });

      const themeToCreateContent =
        BOT_MESSAGES.COMMANDS_FOR_AI.CREATE_CONTENT + headOfDepartmentResult;

      // run Content Manager
      const contentManagerResult = await this.runAssistant({
        threadId: contentManagerThread.id,
        assistantId: contentManager.id,
        role: Role.User,
        message: themeToCreateContent,
      });

      if (!contentManagerResult) {
        await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_ADMIN_CHAT_ID,
          BOT_MESSAGES.ERROR.CONTENT_MANAGER.replace(
            '{assistant_name}',
            ASSISTANT_NAME.CONTENT_MANAGER,
          ),
        );

        return result;
      }

      // initialize Chief Editor
      const { assistant: chiefEditor, assistantThread: chiefEditorThread } =
        await this.initializeAssistant({
          name: ASSISTANT_NAME.CHIEF_EDITOR,
          instructions: BASE_INSTRUCTIONS.CHIEF_EDITOR,
          tools: [{ type: Tool.CODE_INTERPRETER }],
          model: OPENAI_MODEL.GPT4_LATEST,
        });

      // run Chief Editor
      const chiefEditorResult = await this.runAssistant({
        threadId: chiefEditorThread.id,
        assistantId: chiefEditor.id,
        role: Role.User,
        message: contentManagerResult,
      });

      if (!chiefEditorResult) {
        await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_ADMIN_CHAT_ID,
          BOT_MESSAGES.ERROR.CHIEF_EDITOR.replace(
            '{assistant_name}',
            ASSISTANT_NAME.CHIEF_EDITOR,
          ),
        );

        return result;
      }

      // Check the length of the post and update it if necessary
      const checkedPost = await this.checkAndUpdatePost({
        post: chiefEditorResult,
        threadId: chiefEditorThread.id,
        assistantId: chiefEditor.id,
      });

      result['success'] = true;
      result['theme'] = headOfDepartmentResult;
      result['post'] = checkedPost;
      result['postLongVersion'] = chiefEditorResult;

      return result;
    } catch (error) {
      return result;
    }
  }

  async initializeAssistant(options: InitializeAssistantParams) {
    const { name, instructions, tools, model } = options;

    try {
      const assistant = await this.aiController.initializeAssistant({
        name,
        instructions,
        tools,
        model,
      });
      const assistantThread = await this.aiController.createThread();

      return { assistant, assistantThread };
    } catch (error) {
      console.log('initializeAssistant error :::', error);
    }
  }

  async runAssistant(options: RunAssistantParams) {
    const { threadId, assistantId, role, message } = options;

    try {
      await this.aiController.addMessageToThread({
        threadId,
        message: {
          role,
          content: message,
        },
      });

      return await this.aiController.runAssistant({
        threadId: threadId,
        assistantId,
      });
    } catch (error) {
      console.log('runAssistant error :::', error);
    }
  }

  async checkAndUpdatePost(options: CheckAndUpdatePostParams) {
    const { post, threadId, assistantId } = options;
    let updatedPost = post;

    while (updatedPost.length > POST_LENGTH) {
      // updated thread witb Chief Editor result
      await this.aiController.addMessageToThread({
        threadId,
        message: {
          role: Role.Assistant,
          content: updatedPost,
        },
      });

      // add to thread new command === re-write the post
      updatedPost = await this.runAssistant({
        threadId: threadId,
        assistantId,
        role: Role.User,
        message: BOT_MESSAGES.REWRITE_POST.replace(
          '{POST_LENGTH}',
          String(POST_LENGTH),
        ),
      });
    }

    return updatedPost;
  }

  async sendPost() {
    try {
      const {
        success,
        post: createdPost,
        theme,
        postLongVersion,
      } = await this.createPost();

      if (!success) {
        return await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_ADMIN_CHAT_ID,
          BOT_MESSAGES.ERROR.CREATE_POST,
        );
      }

      // send full version post
      await this.bot.telegram.sendMessage(
        process.env.TELEGRAM_PUBLIC_CHANNEL,
        postLongVersion,
        {
          parse_mode: 'Markdown',
        },
      );

      // create a poster for the post
      const poster = await this.aiController.imageAssistant({
        model: OPENAI_MODEL.DALLE_LATEST,
        prompt: theme,
      });

      let telegramPostData = null;

      // send post without poster to the Telegram channel
      if (!poster) {
        telegramPostData = await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_PUBLIC_CHANNEL,
          createdPost,
          {
            parse_mode: 'Markdown',
          },
        );
      }
      // send post with poster to the Telegram channel
      else {
        telegramPostData = await this.bot.telegram.sendPhoto(
          process.env.TELEGRAM_PUBLIC_CHANNEL,
          poster,
          {
            caption: `${createdPost}`,
            parse_mode: 'Markdown',
          },
        );
      }

      if (!telegramPostData) {
        return await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_ADMIN_CHAT_ID,
          BOT_MESSAGES.ERROR.POST_WAS_NOT_ADDED,
        );
      }

      const postUrl =
        'https://t.me/' +
        process.env.TELEGRAM_PUBLIC_CHANNEL.replace('@', '') +
        '/' +
        telegramPostData.message_id;

      const messageToReply = BOT_MESSAGES.POST_MESSAGE.replace(
        '{theme}',
        theme,
      ).replace('{URL}', `<a href="${postUrl}">посиланням</a>`);

      await this.bot.telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        messageToReply,
        {
          parse_mode: 'HTML',
        },
      );
    } catch (error) {
      console.log('sendPost error :::', error);
    }
  }
}
