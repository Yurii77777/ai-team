import { Command, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cron = require('node-cron');

import { TelegramUtils } from './telegram.utils';

import { COMMANDS } from './telegram.commands';
import { BOT_MESSAGES } from './telegram.messages';

@Update()
export class TelegramController {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly telegramUtils: TelegramUtils,
  ) {
    this.bot.telegram.setMyCommands(COMMANDS);

    cron.schedule('0 6 * * *', async () => {
      await this.telegramUtils.createPost();
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

      const {
        success,
        post: createdPost,
        theme,
      } = await this.telegramUtils.createPost();

      if (!success) {
        await ctx.reply(BOT_MESSAGES.ERROR.CREATE_POST);
      }

      const post = await ctx.telegram.sendMessage(
        process.env.TELEGRAM_PUBLIC_CHANNEL,
        createdPost,
        {
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
        theme,
      ).replace('{URL}', `<a href="${postUrl}">посиланням</a>`);

      await ctx.reply(messageToReply, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.log('ERROR createPost :::', error);
    }
  }
}
