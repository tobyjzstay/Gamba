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
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});

const rest = new REST({ version: "9" }).setToken(token);

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

async function initialiseGuild(guild) {
  let server = {};
  await guild.members
    .fetch()
    .then((members) =>
      members.forEach((member) => (server[member.user.id] = 0))
    );
  fs.writeFileSync(
    `data/${guild.id}.json`,
    JSON.stringify(server, null, 2),
    "utf-8"
  );
}

async function getPoints(guild, userId) {
  try {
    const server = JSON.parse(
      fs.readFileSync(`data/${guild.id}.json`, "utf-8", (err) => {
        console.error(err);
      })
    );
    return server[userId];
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return getPoints(guild, userId);
  }
}

async function addAllPoints(guild, increment) {
  try {
    const server = JSON.parse(
      fs.readFileSync(`data/${guild.id}.json`, "utf-8", (err) => {
        console.error(err);
      })
    );

    let updatedServer = {};
    for (let user in server) {
      updatedServer[user] = server[user] + increment;
    }

    fs.writeFileSync(
      `data/${guild.id}.json`,
      JSON.stringify(updatedServer, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return addAllPoints(guild, increment);
  }
}

client.on("ready", () => {
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
  if (!interaction.isCommand()) return;

  switch (interaction.commandName) {
    case "points":
      let user = interaction.options.getUser("user");
      if (!user) user = interaction.user;
      const guild = interaction.guild;
      let points = await getPoints(guild, user.id);
      if (!points) points = 0;
      await interaction.reply({
        content: `${user.tag} has ${points} point${points === 1 ? "" : "s"}.`,
        fetchReply: true,
      });
      break;
    default:
      break;
  }
});

client.login(token);
