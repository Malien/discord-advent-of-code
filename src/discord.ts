import { Client, Intents } from "discord.js"
import { fetchLeaderboard } from "./api.js"
import { currentCompetitionDay, formatLeaderboard } from "./format.js"
import { AOC_SESSION, DISCORD_TOKEN, LEADERBOARD } from "./config.js"
import { leaderboardForDay } from "./leaderboard.js"

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
client.once("ready", () => {
    console.log("Application is ready and goin'")
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return

    console.log(
        `Received interaction command ${interaction.commandName} from ${interaction.user.tag}(${interaction.user.id}) in guild ${interaction.guild?.name}(${interaction.guild?.id})`
    )
    switch (interaction.commandName) {
        case "today":
            const leaderboard = await fetchLeaderboard(LEADERBOARD, 2021, AOC_SESSION)
            const forToday = leaderboardForDay(
                leaderboard,
                currentCompetitionDay()
            )
            interaction.reply(formatLeaderboard(forToday))
            break
        case "default":
            console.warn(
                `Unknown command interaction ${interaction.commandName}`
            )
    }
})

client.login(DISCORD_TOKEN)