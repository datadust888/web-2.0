// bot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || '';

if (!TOKEN) {
  console.error('BOT_TOKEN missing in .env');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const reply_markup = {
    keyboard: [[{ text: 'Открыть FiatValue', web_app: { url: WEBAPP_URL || 'https://example.com' } }]],
    resize_keyboard: true,
    one_time_keyboard: false
  };
  await bot.sendMessage(chatId, 'Нажмите кнопку, чтобы открыть WebApp:', { reply_markup });
});

console.log('Bot started (polling). Use /start to show WebApp button.');