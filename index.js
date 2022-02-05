/**
 * Gamba
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const DiscordJS = require("discord.js");
const { Client, Intents } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, token } = require("./config.json");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const commands = [
  {
    name: "points",
    description: "Get points",
    options: [
      {
        name: "user",
        description: "The user to get points",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.USER,
      },
    ],
  },
];

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

async function initialiseGuild(guildId) {
  fs.writeFileSync(`data/${guildId}.json`, "{}", "utf-8");
}

async function getPoints(guildId, userId) {
  try {
    const data = JSON.parse(
      fs.readFileSync(`data/${guildId}.json`, "utf-8", (err) => {
        console.error(err);
      })
    );
    return data[userId];
  } catch (err) {
    console.error(err);
    return initialiseGuild(guildId).then(await getPoints(guildId, userId));
  }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  switch (interaction.commandName) {
    case "points":
      let user = interaction.options.getUser("user");
      if (!user) user = interaction.user;
      const guildId = interaction.guildId;
      const points = await getPoints(guildId, user.id);
      await interaction.reply({
        content: `${user.tag} has ${points ? points : 0} points.`,
        fetchReply: true,
      });
      break;
    default:
      break;
  }
});

client.login(token);
