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
if (!aocSession)
    throw new Error("Advent of code session cookie is not provided")

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
client.once("ready", () => {
    console.log("Application is ready and goin'")
})

interface MemberCore {
    id: string
    name?: string
    localScore: number
    globalScore: number
    stars: string
    lastStarTs?: number
}

interface Member extends MemberCore {
    completionDayLevel: Record<
        number,
        {
            1: { get_star_ts: number }
            2?: { get_star_ts: number }
        }
    >
}

interface MemberDay extends MemberCore {
    day: number
    firstStar?: number
    secondStar?: number
}

interface MemberFirstStar extends MemberDay {
    firstStar: number
}

interface MemberSecondStar extends MemberFirstStar {
    secondStar: number
}

const solvedFirst = (member: MemberDay): member is MemberFirstStar =>
    member.firstStar !== undefined
const solvedSecond = (member: MemberDay): member is MemberSecondStar =>
    member.secondStar !== undefined
const memberForDay =
    (day: number) =>
    ({ completionDayLevel, ...core }: Member): MemberDay => ({
        ...core,
        day,
        firstStar: completionDayLevel[day]?.[1].get_star_ts,
        secondStar: completionDayLevel[day]?.[2]?.get_star_ts,
    })
const leaderboardForDay = (
    { members, ...rest }: Leaderboard,
    day: number
): LeaderboardDay => ({
    ...rest,
    day,
    members: members.map(memberForDay(day)),
})

interface Leaderboard {
    ownerId: string
    event: string
    members: Member[]
}

interface LeaderboardDay {
    day: number
    ownerId: string
    event: string
    members: MemberDay[]
}

class ResponseError extends Error {
    constructor(public status: number, public response: string) {
        super(`Error response from advent of code: ${status} - ${response}`)
    }
}

interface APIMember {
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

interface APILeaderboard {
    owner_id: string
    event: string
    members: Record<string, APIMember>
}

const toDomainMember = (member: APIMember): Member => ({
    id: member.id,
    globalScore: member.global_score,
    localScore: member.local_score,
    lastStarTs: member.last_star_ts !== "0" ? member.last_star_ts : undefined,
    name: member.name || undefined,
    stars: member.stars,
    completionDayLevel: member.completion_day_level,
})

const toDomainLeaderboard = (lb: APILeaderboard): Leaderboard => ({
    ownerId: lb.owner_id,
    event: lb.event,
    members: Object.values(lb.members).map(toDomainMember),
})

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
    const leaderboard = (await res.json()) as APILeaderboard
    return toDomainLeaderboard(leaderboard)
}

const formatTime = (timestamp: number) =>
    dateformat(new Date(timestamp * 1000), "H:MM")

const cmpMembers = (a: MemberDay, b: MemberDay) => {
    if (a.secondStar && b.secondStar) {
        return a.secondStar - b.secondStar
    }
    if (a.secondStar) {
        return -1
    }
    if (b.secondStar) {
        return 1
    }
    if (a.firstStar && b.firstStar) {
        return a.firstStar - b.firstStar
    }
    if (a.firstStar) {
        return -1
    }
    if (b.firstStar) {
        return 1
    }
    return 0
}

const cmpFirstStar = (a: MemberFirstStar, b: MemberFirstStar) =>
    a.firstStar - b.firstStar

const cmpSecondStar = (a: MemberSecondStar, b: MemberSecondStar) =>
    a.secondStar - b.secondStar

const cmpLocalScore = (a: MemberCore, b: MemberCore) =>
    a.localScore - b.localScore

interface EntryFormatOptions {
    position: number
    totalEntries: number
    largestName?: number
    leaderboardPosition: number
    previousLeaderboardPosition?: number
}

function formatPositionChange(
    leaderboardPosition: number,
    previousLeaderboardPosition: number,
    totalEntries: number
) {
    const change = previousLeaderboardPosition - leaderboardPosition

    const positionStr = String(leaderboardPosition).padStart(1 + Math.log10(totalEntries) | 0)

    if (change === 0) {
        return positionStr
    }
    if (change > 0) {
        return `${positionStr} (🔺 +${change})`
    }
    return `${positionStr} (🔻 ${change})`
}

function formatEntry(
    member: MemberDay,
    {
        position,
        totalEntries,
        largestName = 0,
        leaderboardPosition,
        previousLeaderboardPosition = 0,
    }: EntryFormatOptions
) {
    const name = (member.name || `<anonymous ${member.id}>`).padEnd(largestName)
    const firstStarTime = member.firstStar
        ? `⭐: ${formatTime(member.firstStar).padEnd(5)}`
        : "         "
    const secondStarTime = member.secondStar
        ? `🌟: ${formatTime(member.secondStar).padEnd(5)}`
        : "         "
    const positionSpacesRequired =
        Math.log10(totalEntries) - Math.floor(Math.log10(position)) + 1
    const positionSpacing = "".padEnd(positionSpacesRequired)
    const positionChange = formatPositionChange(
        leaderboardPosition,
        previousLeaderboardPosition,
        totalEntries
    )

    return `${position}.${positionSpacing}${name}    ${firstStarTime}    ${secondStarTime}    ${positionChange}`
}

function formatLeaderboard({ members, day }: LeaderboardDay) {
    const activeMembers = Object.values(members).filter(
        member => member.localScore
    )
    const largestName = Math.max(
        ...activeMembers.map(member => {
            const name = member.name || `<anonymous ${member.id}>`
            return name.length
        })
    )
    const scoresForToday = computeScores(members)
    const positionForToday = new Map(
        members
            .sort(cmpLocalScore)
            .map((member, idx) => [member.id, members.length - idx] as const)
    )
    const positionsForYesterday = new Map(
        members
            .map(member => ({
                ...member,
                localScore: member.localScore - scoresForToday[member.id],
            }))
            .sort(cmpLocalScore)
            .map((member, idx) => [member.id, members.length - idx] as const)
    )

    const formattedLeaderboard = activeMembers
        .sort(cmpMembers)
        .map((member, idx) =>
            formatEntry(member, {
                position: idx + 1,
                totalEntries: activeMembers.length,
                largestName,
                leaderboardPosition: positionForToday.get(member.id)!,
                previousLeaderboardPosition: positionsForYesterday.get(
                    member.id
                ),
            })
        )
        .join("\n")

    return `Today's rankings (day ${day}):\`\`\`\n${formattedLeaderboard}\`\`\``
}

function computeScores(members: MemberDay[]) {
    const whoSolvedFirst = members.filter(solvedFirst)
    const firstStarScores = whoSolvedFirst
        .sort(cmpFirstStar)
        .map((member, idx) => [member, members.length - idx] as const)
    const secondStarScores = whoSolvedFirst
        .filter(solvedSecond)
        .sort(cmpSecondStar)
        .map((member, idx) => [member, members.length - idx] as const)
    const scores = Object.fromEntries(members.map(_ => [_.id, 0]))
    for (const [{ id }, score] of [...firstStarScores, ...secondStarScores]) {
        scores[id] += score
    }
    return scores
}

const competitionStart = new Date(2021, 11, 1, 5, 0)
const currentCompetitionDay = () =>
    //@ts-ignore
    Math.ceil((Date.now() - competitionStart) / (24 * 60 * 60 * 1000))

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return

    console.log(
        `Received interaction command ${interaction.commandName} from ${interaction.user.tag}(${interaction.user.id}) in guild ${interaction.guild?.name}(${interaction.guild?.id})`
    )
    switch (interaction.commandName) {
        case "today":
            const leaderboard = await fetchLeaderboard(leaderboardId, 2021)
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

client.login(token)
