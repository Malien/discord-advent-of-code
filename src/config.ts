export const {
    DISCORD_TOKEN,
    LEADERBOARD,
    AOC_SESSION,
    TELEGRAM_TOKEN,
} = process.env as Record<string, string>
if (!DISCORD_TOKEN) throw new Error("Discord token is not provided")
if (!LEADERBOARD) throw new Error("Leaderboard id is not provided")
if (!AOC_SESSION)
    throw new Error("Advent of code session cookie is not provided")
if (!TELEGRAM_TOKEN) throw new Error("Telegram token is not provided")