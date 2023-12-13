import { Member, MemberDay, memberForDay } from "./member.mjs"

export interface Leaderboard {
    ownerId: string
    event: string
    members: Member[]
}

export interface LeaderboardDay {
    day: number
    ownerId: string
    event: string
    members: MemberDay[]
}

export const leaderboardForDay = (
    { members, ...rest }: Leaderboard,
    day: number,
): LeaderboardDay => ({
    ...rest,
    day,
    members: members.map(memberForDay(day)),
})
