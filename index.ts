import { Client, Intents } from "discord.js"
import dateformat from "dateformat"
import fetch from "node-fetch"

const token = process.env.TOKEN
const clientId = process.env.CLIENT
const leaderboardId = process.env.LEADERBOARD
const aocSession = process.env.AOC_SESSION
if (!token) throw new Error("Discord token is not provided")
if (!clientId) throw new Error("Client id is not provided")
if (!leaderboardId) throw new Error("Leaderboard id is not provided")
if (!aocSession) throw new Error("Advent of code session cookie is not provided")

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
client.once("ready", () => {
    console.log("Application is ready and goin'")
})

interface Member {
    id: string
    name: string | null
    local_score: number
    global_score: number
    stars: string
    last_star_ts: number | "0"
    completion_day_level: Record<
        number,
        {
            1: { get_star_ts: number }
            2?: { get_star_ts: number }
        }
    >
}

interface Leaderboard {
    owner_id: string
    event: string
    members: Record<string, Member>
}

class ResponseError extends Error {
    constructor(public status: number, public response: string) {
        super(`Error response from advent of code: ${status} - ${response}`)
    }
}

async function fetchLeaderboard(
    leaderboardId: string,
    year: number
): Promise<Leaderboard> {
    const url = `https://adventofcode.com/${year}/leaderboard/private/view/${leaderboardId}.json`
    console.log(
        `Requesting leaderboard ${leaderboardId} for year ${year}: ${url}`
    )
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            Cookie: `session=${aocSession}`,
        },
    })
    if (!res.ok) {
        throw new ResponseError(res.status, await res.text())
    }
    return res.json() as Promise<Leaderboard>
}

const formatTime = (timestamp: number) =>
    dateformat(new Date(timestamp * 1000), "H:MM")

const cmpMembersByDay = (day: number) => (a: Member, b: Member) => {
    const aSndStar = a.completion_day_level[day][2]?.get_star_ts
    const bSndStar = b.completion_day_level[day][2]?.get_star_ts
    if (aSndStar && bSndStar) {
        return aSndStar - bSndStar
    }
    if (aSndStar) {
        return -1
    }
    if (bSndStar) {
        return 1
    }
    const aFstStar = a.completion_day_level[day][1].get_star_ts
    const bFstStar = a.completion_day_level[day][1].get_star_ts
    return aFstStar - bFstStar
}

function formatLeaderboard(leaderboard: Leaderboard, day: number) {
    const formattedLeaderboard = Object.values(leaderboard.members)
        .filter(member => member.completion_day_level[day])
        .sort(cmpMembersByDay(day))
        .map((member, idx) => {
            const name = member.name || `<anonymous ${member.id}>`
            const firstStarTime = formatTime(
                member.completion_day_level[day][1].get_star_ts
            )
            const secondTimestamp =
                member.completion_day_level[day][2]?.get_star_ts
            const secondStarText = secondTimestamp
                ? `\t🌟: ${formatTime(secondTimestamp)}`
                : ""
            return `${idx + 1}. ${name}\t⭐️: ${firstStarTime}${secondStarText}`
        })
        .join("\n")

    return `Todays ranking (day ${day}):\n${formattedLeaderboard}`
}

const competitionStart = new Date(2021, 11, 1, 5, 0)
const currentCompetitionDay = () =>
    Math.ceil((Date.now() - competitionStart) / (24 * 60 * 60 * 1000))

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return

    console.log(
        `Received interaction command ${interaction.commandName} from ${interaction.user.tag}(${interaction.user.id}) in guild ${interaction.guild?.name}(${interaction.guild?.id})`
    )
    switch (interaction.commandName) {
        case "today":
            const leaderboard = await fetchLeaderboard(leaderboardId, 2021)
            interaction.reply(
                formatLeaderboard(leaderboard, currentCompetitionDay())
            )
            break
        case "default":
            console.warn(
                `Unknown command interaction ${interaction.commandName}`
            )
    }
})

client.login(token)
