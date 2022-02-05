/**
 * Gamba
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const DiscordJS = require("discord.js");
const { Client, Intents, MessageEmbed } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, token } = require("./config.json");
const { getEnvironmentData } = require("worker_threads");
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
  {
    name: "leaderboard",
    description: "Show points leaderboard",
    options: [
      {
        name: "role",
        description: "The role to show leaderboard",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.ROLE,
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
    const server = await readData(guild);
    return server[userId];
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return getPoints(guild, userId);
  }
}

async function readData(guild) {
  return await JSON.parse(
    fs.readFileSync(`data/${guild.id}.json`, "utf-8", (err) => {
      console.error(err);
    })
  );
}

async function addAllPoints(guild, increment) {
  try {
    const server = await readData(guild);

    let updatedServer = {};
    for (let user in server) {
      const isBot = (await client.users.fetch(user)).bot;
      if (isBot) updatedServer[user] = 0;
      else updatedServer[user] = server[user] + increment;
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

  const guild = interaction.guild;

  switch (interaction.commandName) {
    case "points":
      let user = interaction.options.getUser("user");
      if (!user) user = interaction.user;
      let points = await getPoints(guild, user.id);
      if (!points) points = 0;
      await interaction.reply({
        content: `${user.tag} has ${points} point${points === 1 ? "" : "s"}.`,
        fetchReply: true,
      });
      break;
    case "leaderboard":
      await interaction.guild.members.fetch(); // cache update
      let role = interaction.options.getRole("role");
      if (!role) role = guild.roles.everyone;
      const server = await readData(guild);
      let roleMembers = [];
      role.members.forEach((member) => {
        if (member.user.bot) return;
        const points = server[member.user.id];
        const userId = member.user.tag; // TODO change to member.user.id
        const tmp = {};
        tmp[userId] = points;
        if (points) roleMembers.push(tmp);
      });

      let leaderboard = roleMembers
        .map(Object.entries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      let output = "";
      let prevRank;
      let prevPoints;
      for (let i = 0; i < leaderboard.length; i++) {
        if (output) output += "\n";
        const user = leaderboard[i][0][0];
        const points = leaderboard[i][0][1];
        let rank;
        if (points === prevPoints) rank = prevRank;
        else rank = i + 1;
        output += `${rank}. ${user} (${points} point${
          points === 1 ? "" : "s"
        })`;
        prevRank = rank;
        prevPoints = points;
      }

      const embed = new MessageEmbed()
        .setTitle(`${role.name} Leaderboard`)
        .addField(`\u200b`, `${output}`);
      await interaction.reply({
        fetchReply: true,
        embeds: [embed],
      });
    default:
      break;
  }
});

client.login(token);
