import datefns from "date-fns-tz"
import { YEAR, TIMEZONE } from "./config.js"
import { LeaderboardDay } from "./leaderboard.js"
import { MemberDay, cmpLocalScore, cmpFirstStar, cmpSecondStar, cmpMembers, solvedFirst, solvedSecond } from "./member.js"

const formatTime = (timestamp: number) =>
    datefns.formatInTimeZone(new Date(timestamp * 1000), TIMEZONE, "H:mm")

export interface EntryFormatOptions {
    position: number
    totalEntries: number
    largestName?: number
    leaderboardPosition: number
    previousLeaderboardPosition?: number
}

export function formatPositionChange(
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

export function formatEntry(
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

export function formatLeaderboard({ members, day }: LeaderboardDay) {
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

    return `Day ${day} rankings:\n\`\`\`\n${formattedLeaderboard}\`\`\``
}

export function computeScores(members: MemberDay[]) {
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

const competitionStart = new Date(YEAR, 11, 1, 5, 0)
export const currentCompetitionDay = () =>
    //@ts-ignore
    Math.ceil((Date.now() - competitionStart) / (24 * 60 * 60 * 1000))
