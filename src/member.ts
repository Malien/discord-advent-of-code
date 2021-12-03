export interface MemberCore {
    id: string
    name?: string
    localScore: number
    globalScore: number
    stars: string
    lastStarTs?: number
}

export interface Member extends MemberCore {
    completionDayLevel: Record<
        number,
        {
            1: { get_star_ts: number }
            2?: { get_star_ts: number }
        }
    >
}

export interface MemberDay extends MemberCore {
    day: number
    firstStar?: number
    secondStar?: number
}

export interface MemberFirstStar extends MemberDay {
    firstStar: number
}

export interface MemberSecondStar extends MemberFirstStar {
    secondStar: number
}

export const cmpFirstStar = (a: MemberFirstStar, b: MemberFirstStar) =>
    a.firstStar - b.firstStar

export const cmpSecondStar = (a: MemberSecondStar, b: MemberSecondStar) =>
    a.secondStar - b.secondStar

export const cmpLocalScore = (a: MemberCore, b: MemberCore) =>
    a.localScore - b.localScore

export const cmpMembers = (a: MemberDay, b: MemberDay) => {
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

export const solvedFirst = (member: MemberDay): member is MemberFirstStar =>
    member.firstStar !== undefined

export const solvedSecond = (member: MemberDay): member is MemberSecondStar =>
    member.secondStar !== undefined

export const memberForDay =
    (day: number) =>
    ({ completionDayLevel, ...core }: Member): MemberDay => ({
        ...core,
        day,
        firstStar: completionDayLevel[day]?.[1].get_star_ts,
        secondStar: completionDayLevel[day]?.[2]?.get_star_ts,
    })
