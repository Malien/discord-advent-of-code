import pino from "pino"
import discord from "./discord.js"
import telegram from "./telegram.js"

const logger = pino()
const loggers = {
    discord: logger.child({ subsystem: "Discord" }),
    telegram: logger.child({ subsystem: "Telegram" }),
}

discord({ logger: loggers.discord })
telegram({ logger: loggers.telegram }).catch((e) => {
    logger.error(e, "Error occurred while starting Telegram bot")
})
