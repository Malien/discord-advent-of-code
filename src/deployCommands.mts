import { REST, SlashCommandBuilder, Routes } from "discord.js"

const token = process.env.DISCORD_TOKEN
const clientId = process.env.DISCORD_CLIENT
if (!token) throw new Error("Discord token is not provided")
if (!clientId) throw new Error("Client id is not provided")

const rest = new REST({ version: "9" }).setToken(token)

const command = new SlashCommandBuilder()
    .setName("today")
    .setDescription("Show today's task ranking")

await rest.put(Routes.applicationCommands(clientId), {
    body: [command.toJSON()],
})
console.log("Successfully registered commands")
