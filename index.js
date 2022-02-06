/**
 * Gamba
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const DiscordJS = require("discord.js");
const {
  Client,
  Intents,
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, token, path } = require("./config.json");

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
        description: "User to get points",
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
        description: "Role to show leaderboard",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.ROLE,
      },
      {
        name: "results",
        description: "Number of results to show",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "prediction",
    description: "Show a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "create",
    description: "Create a new prediction",
    options: [
      {
        name: "name",
        description: "Name of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "outcome1",
        description: "First possible outcome",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "outcome2",
        description: "Second possible outcome",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "minutes",
        description: "Number of minutes users have to predict",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "hours",
        description: "Number of hours users have to predict",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "days",
        description: "Number of days users have to predict",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "predict",
    description: "Predict with points",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "index",
        description: "Outcome index prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "amount",
        description: "Number of points",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "end",
    description: "End a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "index",
        description: "Outcome index prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "delete",
    description: "Delete a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
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
  if (!fs.existsSync(`${path.points}${guild.id}.json`)) {
    let pointsData = {};
    await guild.members
      .fetch()
      .then((members) =>
        members.forEach((member) => (pointsData[member.user.id] = 0))
      );

    fs.writeFileSync(
      `${path.points}${guild.id}.json`,
      JSON.stringify(pointsData, null, 2),
      "utf-8"
    );
  }
  if (!fs.existsSync(`${path.predictionsActive}${guild.id}.json`)) {
    fs.writeFileSync(
      `${path.predictionsActive}${guild.id}.json`,
      "{}",
      "utf-8"
    );
  }
  if (!fs.existsSync(`${path.predictionsArchive}${guild.id}.json`)) {
    fs.writeFileSync(
      `${path.predictionsArchive}${guild.id}.json`,
      "{}",
      "utf-8"
    );
  }
}

async function getPoints(guild, userId) {
  try {
    const pointsData = await readData(guild, path.points);
    return pointsData[userId];
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return getPoints(guild, userId);
  }
}

async function readData(guild, path) {
  return await JSON.parse(
    fs.readFileSync(`${path}${guild.id}.json`, "utf-8", (err) => {
      console.error(err);
    })
  );
}

async function addAllPoints(guild, increment) {
  try {
    const pointsData = await readData(guild, path.points);

    let updatedPointsData = {};
    for (let user in pointsData) {
      const isBot = (await client.users.fetch(user)).bot;
      if (isBot) updatedPointsData[user] = 0;
      else updatedPointsData[user] = pointsData[user] + increment;
    }

    fs.writeFileSync(
      `${path.points}${guild.id}.json`,
      JSON.stringify(updatedPointsData, null, 2),
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
  if (interaction.isButton()) {
    // TODO
    console.log(interaction);
  }
  if (!interaction.isCommand()) return;
  if (interaction.user.bot || !interaction.channel) return;

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
      let results = interaction.options.getInteger("results");
      if (!results) results = 10;
      else if (results < 1 || results > 25) {
        interaction.reply({
          content:
            "Invalid input for **results**. Enter a number between **1** and **25**.",
          ephemeral: true,
        });
        break;
      }
      const pointsData = await readData(guild.points);
      let roleMembers = [];
      role.members.forEach((member) => {
        if (member.user.bot) return;
        const points = pointsData[member.user.id];
        const user = member.user;
        const tmp = {};
        tmp[user] = points;
        if (points) roleMembers.push(tmp);
      });

      let leaderboard = roleMembers
        .map(Object.entries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, results);

      let userLeaderboard = "";
      let pointsLeaderboard = "";
      let prevRank;
      let prevPoints;
      for (let i = 0; i < leaderboard.length; i++) {
        if (userLeaderboard && pointsLeaderboard) {
          userLeaderboard += "\n";
          pointsLeaderboard += "\n";
        }
        const user = leaderboard[i][0][0];
        const points = leaderboard[i][0][1];
        let rank;
        if (points === prevPoints) rank = prevRank;
        else rank = i + 1;
        userLeaderboard += `**${rank}. **${user}`;
        pointsLeaderboard += `${points}`;
        prevRank = rank;
        prevPoints = points;
      }

      const attachment = new MessageAttachment("./images/founder.png");
      const embed = new MessageEmbed()
        .setColor("#9346ff")
        .setTitle(`Leaderboard`)
        .setDescription(`Top ${results} results for ${role}`)
        .setThumbnail("attachment://founder.png")
        .addFields(
          {
            name: "\u1CBC\u1CBCUser",
            value: `${userLeaderboard}`,
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
        files: [attachment],
      });
      break;
    case "prediction":
      const option1Image = new MessageAttachment("./images/option1.png");
      const option2Image = new MessageAttachment("./images/option2.png");
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setDisabled(true)
          .setCustomId("option1")
          .setLabel('Bet "Yes"')
          .setStyle("PRIMARY"),
        new MessageButton()
          .setDisabled(true)
          .setCustomId("option2")
          .setLabel('Bet "No"')
          .setStyle("SECONDARY"),
        new MessageButton()
          .setDisabled(true)
          .setCustomId("closeEnd")
          .setLabel("Close")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setDisabled(true)
          .setCustomId("delete")
          .setLabel("Delete")
          .setStyle("DANGER")
      );

      const embedTitle = new MessageEmbed()
        .setColor("#404040")
        .setTitle(`Will TSM beat CLG?`)
        .setDescription(`7:13 left to predict/Predictions closed`)
        .setAuthor({
          name: `${interaction.user.tag}`,
          iconURL: `${interaction.user.displayAvatarURL()}`,
        });
      const embed1 = new MessageEmbed()
        .setColor("#387aff")
        .setTitle(`Yes (51%)`)
        .setThumbnail("attachment://option1.png")
        .addFields(
          {
            name: "\u200b",
            value: `:yellow_circle: **Total Points:** 12.6M\n:trophy: **Return Ratio:** 1:69\n:family_man_girl: **Total Voters:** 2.5K\n:medal: ${interaction.user} 250K`,
            inline: true,
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: true,
          }
        );
      const embed2 = new MessageEmbed()
        .setColor("#f5009b")
        .setTitle(`No (49%)`)
        .setThumbnail("attachment://option2.png")
        .addFields(
          {
            name: "\u200b",
            value: `:yellow_circle: **Total Points:** 12.6M\n:trophy: **Return Ratio:** 1:69\n:family_man_girl: **Total Voters:** 2.5K\n:medal: ${interaction.user} 250K`,
            inline: true,
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: true,
          }
        );

      await interaction.reply({
        allowedMentions: { users: [] },
        fetchReply: true,
        embeds: [embedTitle, embed1, embed2],
        files: [option1Image, option2Image],
        components: [row],
      });
    case "create":
      const name = interaction.options.getString("name");
      const option1 = interaction.options.getString("option1");
      const option2 = interaction.options.getString("option2");
      let minutes = interaction.options.getInteger("minutes");
      let hours = interaction.options.getInteger("hours");
      let days = interaction.options.getInteger("days");
      if (minutes === null) minutes = 0;
      if (hours === null) hours = 0;
      if (days === null) days = 0;

      let message;
      if (minutes < 0 || minutes > 59)
        message =
          "Invalid input for **minutes**. Enter an integer between **0** and **59**.";
      else if (hours < 0 || hours > 23)
        message =
          "Invalid input for **hours**. Enter an integer between **0** and **23**.";
      else if (days < 0 || days > 365)
        message =
          "Invalid input for **days**. Enter an integer between **0** and **365**.";
      else if (minutes === 0 && hours === 0 && days === 0) minutes = 5;

      if (message) {
        interaction.reply({
          content: message,
          ephemeral: true,
        });
        break;
      }

      const prediction = {
        name: name,
        author: interaction.user.id,
        created: new Date(),
        duration: {
          minutes: minutes,
          hours: hours,
          days: days,
        },
        closed: false,
        options: [
          {
            option: option1,
            voters: {},
          },
          {
            option: option2,
            voters: {},
          },
        ],
      };

      await addPrediction(guild, prediction);
    default:
      break;
  }
});

async function addPrediction(guild, prediction) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);

    let updatedPredictionsActiveData = predictionsActiveData;
    for (let i = 1; true; i++) {
      if (!updatedPredictionsActiveData[i]) {
        updatedPredictionsActiveData[i] = prediction;
        break;
      }
    }

    fs.writeFileSync(
      `${path.predictionsActive}${guild.id}.json`,
      JSON.stringify(updatedPredictionsActiveData, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return addPrediction(guild);
  }
}

client.login(token);
