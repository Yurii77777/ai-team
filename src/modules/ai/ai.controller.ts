import 'dotenv/config';
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import {
  ASSISTANT_NAME,
  BASE_INSTRUCTIONS,
  OPENAI_MODEL,
} from 'src/config/ai.config';
import {
  AddMessageToThreadParams,
  RunAssistantParams,
} from 'src/types/ai.types';

export class AiController {
  async initializeSMMmanager() {
    try {
      return await openai.beta.assistants.create({
        name: ASSISTANT_NAME.SMM_MANAGER,
        instructions: BASE_INSTRUCTIONS.SMM_MANAGER,
        tools: [{ type: 'code_interpreter' }],
        model: OPENAI_MODEL.GPT4_LATEST,
      });
    } catch (error) {
      console.log('ERROR initializeSMMmanager :::', error);
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
          .on('textDelta', (textDelta, snapshot) => {
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
