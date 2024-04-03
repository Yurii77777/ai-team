import 'dotenv/config';
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import {
  AddMessageToThreadParams,
  InitializeAssistantParams,
  RunAssistantParams,
} from 'src/types/ai.types';

export class AiController {
  async initializeAssistant(options: InitializeAssistantParams) {
    const { name, instructions, tools, model } = options;

    try {
      return await openai.beta.assistants.create({
        name,
        instructions,
        tools: tools,
        model: model,
      });
    } catch (error) {
      console.log('ERROR initializeAssistant :::', error);
    }
  }

  async createThread() {
    try {
      return await openai.beta.threads.create();
    } catch (error) {
      console.log('ERROR createThread :::', error);
    }
  }

  async addMessageToThread(options: AddMessageToThreadParams) {
    const { threadId, message } = options;

    try {
      return await openai.beta.threads.messages.create(threadId, message);
    } catch (error) {
      console.log('ERROR addMessageToThread :::', error);
    }
  }

  async runAssistant(options: RunAssistantParams): Promise<string> {
    const { threadId, assistantId } = options;

    try {
      let fullResponse = '';

      return new Promise((resolve, reject) => {
        openai.beta.threads.runs
          .createAndStream(threadId, {
            assistant_id: assistantId,
          })
          .on('textDelta', (textDelta) => {
            fullResponse += textDelta.value;
          })
          .on('end', () => {
            resolve(fullResponse);
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    } catch (error) {
      console.log('ERROR runAssistant :::', error);
    }
  }
}
