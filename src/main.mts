import discord from "./discord.mjs"
import { loggers } from "./log.mjs"
import telegram from "./telegram.mjs"

discord({ logger: loggers.discord })
telegram({ logger: loggers.telegram }).catch(e => {
    loggers.telegram.error(e, "Error occurred while starting Telegram bot")
})
