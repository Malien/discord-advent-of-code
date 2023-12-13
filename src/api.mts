import fetch from "node-fetch"
import pino from "pino"
import { Leaderboard } from "./leaderboard.mjs"
import { Member } from "./member.mjs"

const logger = pino()

export class ResponseError extends Error {
    constructor(
        public status: number,
        public response: string,
    ) {
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

export async function fetchLeaderboard(
    leaderboardId: string,
    year: number,
    session: string,
): Promise<Leaderboard> {
    const url = `https://adventofcode.com/${year}/leaderboard/private/view/${leaderboardId}.json`
    logger.info({ leaderboardId, year, url }, "Requesting leaderboard")
    const start = performance.now()
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            Cookie: `session=${session}`,
        },
    })
    if (!res.ok) {
        const contents = await res.text()
        logger.error(
            { status: res.status, contents },
            "Advent of code responded with an error",
        )
        throw new ResponseError(res.status, contents)
    }
    const leaderboard = (await res.json()) as APILeaderboard
    logger.info({ took: performance.now() - start }, "Received AoC leaderboard")
    return toDomainLeaderboard(leaderboard)
}
