import { Client, Intents } from "discord.js"
import pino, { Logger } from "pino"
import { fetchLeaderboard } from "./api.js"
import { currentCompetitionDay, formatLeaderboard } from "./format.js"
import { AOC_SESSION, DISCORD_TOKEN, LEADERBOARD, YEAR } from "./config.js"
import { leaderboardForDay } from "./leaderboard.js"

export interface DiscordBotOptions {
    logger?: Logger
}

export default function startDiscordBot({
    logger = pino(),
}: DiscordBotOptions) {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    client.once("ready", () => {
        logger.info("Application is ready and goin")
    })
    client.on("error", logger.error)

    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand()) return

        logger.info(
            {
                type: interaction.type,
                user: interaction.user,
                member: interaction.member,
                guild: interaction.guild,
                applicationId: interaction.applicationId,
                channelId: interaction.channelId,
                id: interaction.id,
            },
            `Received interaction command`
        )

        if (interaction.commandName === "today") {
            try {
                interaction.deferReply()

                const leaderboard = await fetchLeaderboard(
                    LEADERBOARD,
                    YEAR,
                    AOC_SESSION
                )
                const forToday = leaderboardForDay(
                    leaderboard,
                    currentCompetitionDay()
                )

                interaction.editReply(formatLeaderboard(forToday))
            } catch (e) {
                logger.error(e, "Error occurred while handling /today command")
            }
        } else {
            logger.warn(
                `Unknown command interaction ${interaction.commandName}`
            )
        }
    })

    client.login(DISCORD_TOKEN)
}
