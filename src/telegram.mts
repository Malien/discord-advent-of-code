import pino, { Logger } from "pino"
import { Telegraf } from "telegraf"
import { v4 as uuid } from "uuid"
import { fetchLeaderboard } from "./api.mjs"
import { AOC_SESSION, LEADERBOARD, TELEGRAM_TOKEN, YEAR } from "./config.mjs"
import { currentCompetitionDay, formatLeaderboard } from "./format.mjs"
import { leaderboardForDay } from "./leaderboard.mjs"
import { withRequestId } from "./log.mjs"

export interface TelegramBotOptions {
    logger?: Logger
}

export default async function createTelegramBot({
    logger = pino(),
}: TelegramBotOptions = {}) {
    const bot = new Telegraf(TELEGRAM_TOKEN)

    bot.command("today", ctx => {
        withRequestId("Telegram", async () => {
            logger.info({ sender: ctx.senderChat }, "Received /today command")
            try {
                const leaderboard = await fetchLeaderboard(
                    LEADERBOARD,
                    YEAR,
                    AOC_SESSION,
                )
                const forToday = leaderboardForDay(
                    leaderboard,
                    currentCompetitionDay(),
                )
                ctx.replyWithMarkdownV2(formatLeaderboard(forToday))
            } catch (e) {
                logger.error(e, "Error occurred while handling /today command")
            }
        })
    })

    bot.on("inline_query", ctx => {
        withRequestId("Telegram", async () => {
            logger.info(ctx.inlineQuery, "Received inline query")

            try {
                const leaderboard = await fetchLeaderboard(
                    LEADERBOARD,
                    YEAR,
                    AOC_SESSION,
                )
                const forToday = leaderboardForDay(
                    leaderboard,
                    currentCompetitionDay(),
                )

                ctx.answerInlineQuery([
                    {
                        type: "article",
                        title: "Standings",
                        id: uuid(),
                        input_message_content: {
                            message_text: formatLeaderboard(
                                forToday,
                            ).replaceAll(/[()]/g, ""),
                            parse_mode: "Markdown",
                        },
                    },
                ])
            } catch (e) {
                logger.error(e, "Error occurred while handling inline query")
            }
        })
    })

    await bot.launch()
    logger.info("Started telegram bot")

    await bot.telegram.setMyCommands([
        { command: "today", description: "Get today's leaderboard standings" },
    ])
}
