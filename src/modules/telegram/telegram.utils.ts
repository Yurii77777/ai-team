import { Injectable } from '@nestjs/common';

import { AiController } from '../ai/ai.controller';

import {
  ASSISTANT_NAME,
  BASE_INSTRUCTIONS,
  OPENAI_MODEL,
} from '../../config/ai.config';
import { Role, Tool } from '../../types/ai.types';
import { BOT_MESSAGES } from './telegram.messages';

@Injectable()
export class TelegramUtils {
  constructor(private readonly aiController: AiController) {}

  async createPost(
    ctx,
  ): Promise<{ success: boolean; post: string; theme: string }> {
    const result = {
      success: false,
      theme: '',
      post: '',
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
        await ctx.reply(
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
        await ctx.reply(
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
        await ctx.reply(
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
        await ctx.reply(
          BOT_MESSAGES.ERROR.CHIEF_EDITOR.replace(
            '{assistant_name}',
            ASSISTANT_NAME.CHIEF_EDITOR,
          ),
        );

        return result;
      }

      result['success'] = true;
      result['theme'] = headOfDepartmentResult;
      result['post'] = chiefEditorResult;

      return result;
    } catch (error) {
      return result;
    }
  }

  async initializeAssistant(options: { name; instructions; tools; model }) {
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

  async runAssistant(options: {
    threadId: string;
    assistantId: string;
    role: Role;
    message: string;
  }) {
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
}
