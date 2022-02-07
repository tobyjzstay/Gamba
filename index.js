/**
 * Gamba Application.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const { Client, Intents } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, token, path } = require("./config.json");
const { readData, initialiseGuild, addAllPoints } = require("./helper");
const schema = require("./schema");

const commands = {};
const normalizedPath = require("path").join(__dirname, "commands");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (command) {
    commands[command.slice(0, -3)] = require("./commands/" + command);
  });

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});
const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), {
      body: schema,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("ready", () => {
  client.user.setActivity("/gamba", { type: "LISTENING" });
  setInterval(() => {
    client.guilds.cache.forEach(async (guild) => {
      await addAllPoints(guild, 10);
    });
  }, 60 * 1000 * 5); // runs every 5 minutes
});

client.on("guildCreate", async (guild) => {
  initialiseGuild(guild);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    // TODO
    console.log(interaction);
  }
  if (!interaction.isCommand()) return;
  if (interaction.user.bot || !interaction.channel) return;

  if (commands[interaction.commandName])
    commands[interaction.commandName](interaction);
});

client.login(token);
