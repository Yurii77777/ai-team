import { Command, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cron = require('node-cron');

import { TelegramUtils } from './telegram.utils';
import { AiController } from '../ai/ai.controller';

import { COMMANDS } from './telegram.commands';
import { BOT_MESSAGES } from './telegram.messages';
import { OPENAI_MODEL } from '../../config/ai.config';

@Update()
export class TelegramController {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly telegramUtils: TelegramUtils,
    private readonly aiController: AiController,
  ) {
    this.bot.telegram.setMyCommands(COMMANDS);

    cron.schedule('0 8 * * *', async () => {
      try {
        await this.telegramUtils.sendPost();
      } catch (error) {
        console.log('error', error);
      }
    });
  }

  @Start()
  async startCommand(ctx): Promise<any> {
    try {
      await ctx.reply(BOT_MESSAGES.NEW_USER_GREETING);
    } catch (error) {
      console.log('Тут шляпа ::: ', error);
    }

    // const chatID = ctx?.update?.message?.from?.id;
    // console.log('chatID', chatID);
  }

  @Command('create_post')
  async createPost(ctx): Promise<any> {
    const chatID = ctx?.update?.message?.from?.id;

    try {
      if (String(chatID) !== process.env.TELEGRAM_ADMIN_CHAT_ID) {
        // Permissions message
        await ctx.reply(BOT_MESSAGES.ERROR.PERMISSIONS);
      }

      // Response to bot's admin
      await ctx.reply(BOT_MESSAGES.TASK_ADDED);
      await ctx.reply(BOT_MESSAGES.LOADER);

      const {
        success,
        post: createdPost,
        theme,
      } = await this.telegramUtils.createPost();

      if (!success) {
        await ctx.deleteMessage();
        return await ctx.reply(BOT_MESSAGES.ERROR.CREATE_POST);
      }

      // create a poster for the post
      const poster = await this.aiController.imageAssistant({
        model: OPENAI_MODEL.DALLE_LATEST,
        prompt: theme,
      });

      let telegramPostData = null;

      // send post without poster to the Telegram channel
      if (!poster) {
        telegramPostData = await ctx.telegram.sendMessage(
          process.env.TELEGRAM_PUBLIC_CHANNEL,
          createdPost,
          {
            parse_mode: 'Markdown',
          },
        );
      }
      // send post with poster to the Telegram channel
      else {
        telegramPostData = await ctx.telegram.sendPhoto(
          process.env.TELEGRAM_PUBLIC_CHANNEL,
          poster,
          {
            caption: `${createdPost}`,
            parse_mode: 'Markdown',
          },
        );
      }

      if (!telegramPostData) {
        await ctx.deleteMessage();
        return await ctx.reply(BOT_MESSAGES.ERROR.POST_WAS_NOT_ADDED);
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

      await ctx.deleteMessage();
      await ctx.reply(messageToReply, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.log('ERROR createPost :::', error);
    }
  }

  @Command('create_image')
  async createImage(): Promise<any> {
    const request =
      'Новий пост на тему: Оптимізація веб-ресурсів для пошукових систем: базові SEO техніки для розробників';

    try {
      const img = await this.aiController.imageAssistant({
        model: OPENAI_MODEL.DALLE_LATEST,
        prompt: request,
      });

      console.log('img', img);
    } catch (error) {
      console.log('ERROR createImage :::', error);
    }
  }
}
