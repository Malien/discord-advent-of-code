Just a simple Advent of Code™️ leaderboard reporting bot for discord and telegram

This guy is supposed to be used on a single private leaderboard. Just a cozy lil' leaderboard for competing group of friends. To get today's standings, just send `/today`

<img width="1019" alt="image" src="https://github.com/Malien/discord-advent-of-code/assets/7205038/b481eedc-c46e-41f4-b9a0-5a9c1ce2d780">
<img width="602" alt="image" src="https://github.com/Malien/discord-advent-of-code/assets/7205038/27d6827d-4ba8-42b0-8ac5-96b6f125465f">

Telegram bot also supports embeddings in chat. Just "@bot_name " into any chat, and boom, the results are in! (This is the most fun and used way to get and share standings table)

### Setup
To run this bad boy, supply a couple of env variables, namely:
- `DISCORD_TOKEN`: auth token for a discord bot
- `TELEGRAM_TOKEN`: same thing, but for a telegram bot
- `LEADERBOARD`: a number identifying private AoC leaderboard _(just yoink it from the URL)_
- `AOC_SESSION`: session cookie from AoC web page, used for auth _(just yoink it from the browser devtools)_
- `TIMEZONE`: [a tz identifier](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for which time zone to use to format times. For e.g. if the bot is running on AWS Frankfurt, but used in chats with participants primarily from `Europe/Kyiv`, the times would've been misleading.

Build with `tsc`
Just to register discord commands, run `node out/deployCommands.js` once in the bot lifetime
Run with `node out/index.js`
If pretty printed and persisted logs is your forte `./setup.sh`
