import {
    Client,
    GatewayIntentBits,
    Guild,
    User,
    GuildMember,
    InteractionType,
    Interaction,
    APIInteractionGuildMember,
} from "discord.js"
import pino, { Logger } from "pino"
import { fetchLeaderboard } from "./api.js"
import { currentCompetitionDay, formatLeaderboard } from "./format.js"
import { AOC_SESSION, DISCORD_TOKEN, LEADERBOARD, YEAR } from "./config.js"
import { leaderboardForDay } from "./leaderboard.js"

export interface DiscordBotOptions {
    logger?: Logger
}

function guildDisplay(guild: Guild) {
    return {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
    }
}

function userDisplay(user: User) {
    return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        bot: user.bot,
        system: user.system,
        globalName: user.globalName,
        tag: user.tag,
    }
}

function memberDisplay(member: GuildMember) {
    return {
        nickname: member.nickname,
        displayName: member.displayName,
    }
}

function interactionDisplay(interaction: Interaction) {
    return {
        type: InteractionType[interaction.type],
        user: userDisplay(interaction.user),
        member: interaction.member && memberDisplay(interaction.member as GuildMember),
        guild: interaction.guild && guildDisplay(interaction.guild),
        applicationId: interaction.applicationId,
        channelId: interaction.channelId,
        interactionId: interaction.id,
    }
}

export default function startDiscordBot({
    logger = pino(),
}: DiscordBotOptions = {}) {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] })
    client.once("ready", () => {
        logger.info("Application is ready and goin")
    })
    client.on("error", logger.error)

    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isCommand()) return

        logger.info(
            interactionDisplay(interaction),
            `Received interaction command`,
        )

        if (interaction.commandName === "today") {
            try {
                interaction.deferReply()

                const leaderboard = await fetchLeaderboard(
                    LEADERBOARD,
                    YEAR,
                    AOC_SESSION,
                )
                const forToday = leaderboardForDay(
                    leaderboard,
                    currentCompetitionDay(),
                )

                interaction.editReply(formatLeaderboard(forToday))
            } catch (e) {
                logger.error(e, "Error occurred while handling /today command")
            }
        } else {
            logger.warn(
                `Unknown command interaction ${interaction.commandName}`,
            )
        }
    })

    client.login(DISCORD_TOKEN)
}
