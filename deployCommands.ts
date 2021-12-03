import { REST } from "@discordjs/rest"
import { SlashCommandBuilder } from "@discordjs/builders"
import { Routes } from "discord-api-types/v9";

const token = process.env.TOKEN
const clientId = process.env.CLIENT
if (!token) throw new Error("Discord token is not provided")
if (!clientId) throw new Error("Client id is not provided")

console.log({ token, clientId })

const rest = new REST({ version: '9' }).setToken(token)

const command = new SlashCommandBuilder()
    .setName("today")
    .setDescription("Show today's task ranking")

await rest.put(Routes.applicationCommands(clientId), { body: [command.toJSON()] })
console.log("Successfully registered commands")
