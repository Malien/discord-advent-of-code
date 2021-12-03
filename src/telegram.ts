import { Telegraf } from "telegraf"
import { v4 as uuid } from "uuid"
import { fetchLeaderboard } from "./api.js"
import { AOC_SESSION, LEADERBOARD, TELEGRAM_TOKEN } from "./config.js"
import { currentCompetitionDay, formatLeaderboard } from "./format.js"
import { leaderboardForDay } from "./leaderboard.js"

const bot = new Telegraf(TELEGRAM_TOKEN)
bot.command("today", async ctx => {
    const leaderboard = await fetchLeaderboard(LEADERBOARD, 2021, AOC_SESSION)
    const forToday = leaderboardForDay(leaderboard, currentCompetitionDay())
    ctx.replyWithMarkdown(formatLeaderboard(forToday))
})

bot.on("inline_query", async ctx => {
    console.log(ctx.inlineQuery)

    const leaderboard = await fetchLeaderboard(LEADERBOARD, 2021, AOC_SESSION)
    const forToday = leaderboardForDay(leaderboard, currentCompetitionDay())

    ctx.answerInlineQuery([
        {
            type: "article",
            title: "Standings",
            id: uuid(),
            input_message_content: {
                message_text: formatLeaderboard(forToday).replaceAll(/[()]/g, ""),
                parse_mode: "Markdown"
            }
        }
    ])
})

bot.launch()

await bot.telegram.setMyCommands([
    { command: "today", description: "Get today's leaderboard standings" },
])
