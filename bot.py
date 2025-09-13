# bot.py
import os, asyncio, logging, time
from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from dotenv import load_dotenv
import aiohttp

load_dotenv()
BOT_TOKEN = os.getenv("8498816601:AAF0TLpy5S2a8f3_PuO5kY57QCf7JWP5YU4")
SERVER_URL = os.getenv("SERVER_URL", "http://127.0.0.1:8000")
DOMAIN = os.getenv("https://web-2-0-five.vercel.app/", SERVER_URL)

logging.basicConfig(level=logging.INFO)
bot = Bot(BOT_TOKEN)
dp = Dispatcher()

# HTTP helpers
async def api_post(path, json_data):
    url = SERVER_URL.rstrip("/") + path
    async with aiohttp.ClientSession() as s:
        async with s.post(url, json=json_data, timeout=15) as r:
            return await r.json()

async def api_get(path):
    url = SERVER_URL.rstrip("/") + path
    async with aiohttp.ClientSession() as s:
        async with s.get(url, timeout=15) as r:
            return await r.json()

@dp.message(Command("start"))
async def cmd_start(message: Message):
    user = message.from_user
    args = message.get_args()
    # register on server
    await api_post("/api/profile", {"user_id": user.id, "username": user.username, "display_name": f"{user.first_name or ''} {user.last_name or ''}".strip()})
    if args:
        try:
            ref = int(args)
            await api_post("/api/register_ref", {"referrer": ref, "referred": user.id})
            await message.answer("Referral registered ✅")
        except:
            pass
    await message.answer("Welcome! Use /menu to open the WebApp. Use /freecase to test opening a free case.")

@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer("/start\n/help\n/menu\n/balance\n/freecase")

@dp.message(Command("menu"))
async def cmd_menu(message: Message):
    kb = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="Open App", web_app=WebAppInfo(url=DOMAIN))]], resize_keyboard=True)
    await message.answer("Open WebApp:", reply_markup=kb)

@dp.message(Command("balance"))
async def cmd_balance(message: Message):
    uid = message.from_user.id
    r = await api_post("/api/profile", {"user_id": uid})
    if r.get("ok"):
        p = r["profile"]
        last_free = p.get("last_free", 0) or 0
        remain = max(0, (last_free + 24*3600) - int(time.time()))
        await message.answer(f"Balance: {p.get('balance',0)} ⭐\nNext free: {remain//3600}h {(remain%3600)//60}m")
    else:
        await message.answer("Profile not found. Send /start")

@dp.message(Command("freecase"))
async def cmd_freecase(message: Message):
    uid = message.from_user.id
    res = await api_post("/api/open_case", {"user_id": uid, "case_slug": "free"})
    if res.get("ok"):
        prize = res["prize"]
        if prize["type"] == "stars":
            await message.answer(f"You got {prize['amount']} ⭐")
        else:
            await message.answer(f"You got item: {prize.get('item_name')}")
    else:
        await message.answer("Error: " + str(res.get("error", "unknown")))

@dp.message()
async def handle_all(message: Message):
    if message.web_app_data:
        await message.answer(f"WebApp data: {message.web_app_data.data}")

# Reminder loop: query server for due reminders and notify users
async def reminder_loop():
    await asyncio.sleep(5)
    while True:
        try:
            r = await api_get("/api/due_reminders")
            if r.get("ok"):
                users = r.get("users", [])
                for uid in users:
                    try:
                        kb = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="Open App", web_app=WebAppInfo(url=DOMAIN))]], resize_keyboard=True)
                        await bot.send_message(uid, "🔔 Ваш бесплатный кейс доступен! Откройте WebApp:", reply_markup=kb)
                    except Exception as e:
                        logging.info(f"Could not message {uid}: {e}")
        except Exception as e:
            logging.exception("Reminder loop error:")
        await asyncio.sleep(60*60)  # hourly

async def main():
    asyncio.create_task(reminder_loop())
    await dp.start_polling(bot)
    if __name__ == "__main__":
    asyncio.run(main())
