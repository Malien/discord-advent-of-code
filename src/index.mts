import pino from "pino"
import discord from "./discord.mjs"
import telegram from "./telegram.mjs"

const logger = pino()
const loggers = {
    discord: logger.child({ subsystem: "Discord" }),
    telegram: logger.child({ subsystem: "Telegram" }),
}

discord({ logger: loggers.discord })
telegram({ logger: loggers.telegram }).catch((e) => {
    logger.error(e, "Error occurred while starting Telegram bot")
})
