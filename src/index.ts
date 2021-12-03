import pino from "pino"
import discord from "./discord.js"
import telegram from "./telegram.js"

const logger = pino()

discord({ logger: logger.child({ subsystem: "Discord" }) })
telegram({ logger: logger.child({ subsystem: "Telegram" }) })
