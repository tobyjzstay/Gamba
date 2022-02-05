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
      {
        name: "results",
        description: "Number of results to show",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.NUMBER,
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
        allowedMentions: { users: [] },
        content: `${user} has ${points} point${points === 1 ? "" : "s"}.`,
        fetchReply: true,
      });
      break;
    case "leaderboard":
      await interaction.guild.members.fetch(); // cache update
      let role = interaction.options.getRole("role");
      if (!role) role = guild.roles.everyone;
      let results = interaction.options.getNumber("results");
      if (!results) results = 10;
      else if (results < 1) results = 1;
      else if (results > 25) results = 25;
      const server = await readData(guild);
      let roleMembers = [];
      role.members.forEach((member) => {
        if (member.user.bot) return;
        const points = server[member.user.id];
        const user = member.user;
        const tmp = {};
        tmp[user] = points;
        if (points) roleMembers.push(tmp);
      });

      let leaderboard = roleMembers
        .map(Object.entries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, results);

      let memberLeaderboard = "";
      let pointsLeaderboard = "";
      let prevRank;
      let prevPoints;
      for (let i = 0; i < leaderboard.length; i++) {
        if (memberLeaderboard && pointsLeaderboard) {
          memberLeaderboard += "\n";
          pointsLeaderboard += "\n";
        }
        const user = leaderboard[i][0][0];
        const points = leaderboard[i][0][1];
        let rank;
        if (points === prevPoints) rank = prevRank;
        else rank = i + 1;
        memberLeaderboard += `**${rank}. **${user}`;
        pointsLeaderboard += `${points}`;
        prevRank = rank;
        prevPoints = points;
      }

      const embed = new MessageEmbed()
        .setColor("#9346ff")
        .setTitle(`Leaderboard`)
        .setDescription(`Top ${results} results for ${role}`)
        .setThumbnail(
          "https://static-cdn.jtvnw.net/badges/v1/511b78a9-ab37-472f-9569-457753bbe7d3/3"
        )
        .addFields(
          {
            name: "\u1CBC\u1CBCMember",
            value: `${memberLeaderboard}`,
            inline: true,
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: true,
          },
          {
            name: "Points",
            value: `${pointsLeaderboard}`,
            inline: true,
          }
        );
      await interaction.reply({
        allowedMentions: { users: [] },
        fetchReply: true,
        embeds: [embed],
      });
    default:
      break;
  }
});

client.login(token);
