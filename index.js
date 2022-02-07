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
        name: "option1",
        description: "First possible outcome",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "option2",
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
  {
    name: "gamba",
    description: "Lists all active predictions",
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

    await guild.members.fetch(); // cache update
    guild.roles.everyone.members.forEach((member) => {
      // don't add points to bots
      if (member.user.bot) updatedPointsData[member.user.id] = 0;
      else
        updatedPointsData[member.user.id] =
          pointsData[member.user.id] + increment;
    });

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

  const guild = interaction.guild;

  switch (interaction.commandName) {
    case "gamba":
      const predictionData = await getPredictions(guild);
      let predictions = Object.entries(predictionData)
        .sort((a, b) => a[0] - b[0])
        .slice(0, 25); // TODO expandable?

      const icon = new MessageAttachment("./images/icon.png");
      if (Object.keys(predictions).length === 0) {
        const embedGamba = new MessageEmbed()
          .setColor("#9346ff")
          .setTitle(`Active Predictions`)
          .setDescription("There are currently no active predictions.")
          .setThumbnail("attachment://icon.png")
          .addField("\u200b", "Create your own prediction using `/create`");
        await interaction.reply({
          embeds: [embedGamba],
          fetchReply: true,
          files: [icon],
        });
        break;
      }

      let predictionIds = "";
      let predictionMembers = "";
      let predictionNames = "";
      for (let i = 0; i < predictions.length; i++) {
        if (predictionIds && predictionMembers && predictionNames) {
          predictionIds += "\n";
          predictionMembers += "\n";
          predictionNames += "\n";
        }
        const prediction = predictions[i][1];
        predictionIds += prediction.closed
          ? `~~#${predictions[i][0]}~~`
          : `#${predictions[i][0]}`;
        predictionMembers += prediction.closed
          ? `~~${await interaction.guild.members.fetch(prediction.author)}~~`
          : `${await interaction.guild.members.fetch(prediction.author)}`;
        predictionNames += prediction.closed
          ? `~~${prediction.name}~~`
          : `${prediction.name}`;
      }
      const embedGamba = new MessageEmbed()
        .setColor("#9346ff")
        .setTitle(`Active Predictions`)
        .setDescription(
          "Get more details about each prediction using `/prediction`\nPredictions with a ~~strikethrough~~ are closed."
        )
        .setThumbnail("attachment://icon.png")
        .addFields(
          {
            name: "ID",
            value: `${predictionIds}`,
            inline: true,
          },
          {
            name: "Member",
            value: `${predictionMembers}`,
            inline: true,
          },
          {
            name: "Prediction",
            value: `${predictionNames}`,
            inline: true,
          }
        )
        .addField("\u200b", "Create your own prediction using `/create`");
      await interaction.reply({
        embeds: [embedGamba],
        fetchReply: true,
        files: [icon],
      });
      break;
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
      const pointsData = await readData(guild, path.points);
      let roleMembers = {};
      role.members.forEach((member) => {
        if (member.user.bot) return; // hide bots from leaderboard
        const points = pointsData[member.user.id];
        const user = member.user;
        roleMembers[user] = points;
      });
      if (Object.keys(roleMembers).length === 0) {
        interaction.reply({
          content: `Could not find any users for ${role}`,
          ephemeral: true,
        });
        break;
      }

      // TODO sort by username as well?
      let leaderboard = Object.entries(roleMembers)
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
        const user = leaderboard[i][0];
        const points = leaderboard[i][1];
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
      const id = interaction.options.getInteger("id");
      const prediction = await getPrediction(guild, id);
      if (!prediction) {
        interaction.reply({
          content:
            "Invalid input for **id**. The prediction could not be found. Use `/gamba` to list all the active predictions.",
          ephemeral: true,
        });
        break;
      }

      const option1Image = new MessageAttachment("./images/option1.png");
      const option2Image = new MessageAttachment("./images/option2.png");
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setDisabled(prediction.closed)
          .setCustomId("option1")
          .setLabel(`Predict "${prediction.options[0].option}"`)
          .setStyle("PRIMARY"),
        new MessageButton()
          .setDisabled(prediction.closed)
          .setCustomId("option2")
          .setLabel(`Predict "${prediction.options[1].option}"`)
          .setStyle("SECONDARY"),
        new MessageButton()
          .setCustomId("closeEnd")
          .setLabel(prediction.closed ? "End" : "Close")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setCustomId("delete")
          .setLabel("Delete")
          .setStyle("DANGER")
      );

      const closes1 = new Date(prediction.closes);

      const member = await interaction.guild.members.fetch(prediction.author); // cache update
      const embedTitle = new MessageEmbed()
        .setColor("#404040")
        .setTitle(`${prediction.name}`)
        .setDescription(
          prediction.closed
            ? "Predictions closed"
            : `Prediction closes at ${closes1
                .toLocaleTimeString("en-NZ")
                .toUpperCase()}, ${closes1.toLocaleDateString("en-NZ")}`
        )
        .setAuthor({
          name: `${member.user.tag}`,
          iconURL: `${member.user.displayAvatarURL()}`,
        });

      const voters1 = prediction.options[0].voters;
      const totalPoints1 = Object.entries(voters1).reduce(
        (p, i) => p + i[1],
        0
      );

      const topVoters1 = Object.entries(voters1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1);

      const topVoter1 = topVoters1[0]
        ? await interaction.guild.members.fetch(topVoters1[0][0])
        : null;

      const voters2 = prediction.options[1].voters;
      const totalPoints2 = Object.entries(voters2).reduce(
        (p, i) => p + i[1],
        0
      );

      const topVoters2 = Object.entries(voters2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1);

      const topVoter2 = topVoters2[0]
        ? await interaction.guild.members.fetch(topVoters2[0][0])
        : null;

      const totalVoters1 = Object.keys(voters1).length;
      const totalVoters2 = Object.keys(voters2).length;
      const embed1 = new MessageEmbed()
        .setColor("#387aff")
        .setTitle(
          `${prediction.options[0].option}${
            totalVoters1 + totalVoters2
              ? ` (${Math.round(
                  (totalPoints1 / (totalPoints1 + totalPoints2)) * 100
                )}%)`
              : ``
          }`
        )
        .setThumbnail("attachment://option1.png")
        .addFields(
          {
            name: "\u200b",
            value: `:yellow_circle: **Total Points:** ${totalPoints1}
            :trophy: **Return Ratio:** 1:${
              totalPoints2 / totalPoints1 < 1
                ? Math.round((totalPoints2 / totalPoints1) * 100) / 100 + 1
                : Math.round((totalPoints2 / totalPoints1) * 100) / 100
            }
            :family_man_girl: **Total Voters:** ${
              Object.keys(prediction.options[0].voters).length
            }
            :medal: ${topVoter1 ? `${topVoter1}: ${topVoters1[0][1]}` : "-"}`,
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
        .setTitle(
          `${prediction.options[1].option}${
            totalVoters1 + totalVoters2
              ? ` (${Math.round(
                  (totalPoints2 / (totalPoints1 + totalPoints2)) * 100
                )}%)`
              : ``
          }`
        )
        .setThumbnail("attachment://option2.png")
        .addFields(
          {
            name: "\u200b",
            value: `:yellow_circle: **Total Points:** ${totalPoints2}
            :trophy: **Return Ratio:** 1:${
              totalPoints1 / totalPoints2 < 1
                ? Math.round((totalPoints1 / totalPoints2) * 100) / 100 + 1
                : Math.round((totalPoints1 / totalPoints2) * 100) / 100
            }
            :family_man_girl: **Total Voters:** ${
              Object.keys(prediction.options[1].voters).length
            }
            :medal: ${topVoter2 ? `${topVoter2}: ${topVoters2[0][1]}` : "-"}`,
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
      break;
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
      if (name.length > 100) {
        message =
          "Invalid input for **name**. Must be 100 characters or fewer in length.";
      } else if (option1.length > 32) {
        message =
          "Invalid input for **option1**. Must be 32 characters or fewer in length.";
      } else if (option2.length > 32) {
        message =
          "Invalid input for **option2**. Must be 32 characters or fewer in length.";
      } else if (minutes < 0 || minutes > 59)
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

      const created = new Date();
      let closes = created;
      closes.setDate(closes.getMinutes() + minutes);
      closes.setDate(closes.getHours() + hours);
      closes.setDate(closes.getDate() + days);

      const newPrediction = {
        name: name,
        author: interaction.user.id,
        created: created,
        closes: closes,
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

      await addPrediction(guild, newPrediction);
      break;
    case "predict":
      const id2 = interaction.options.getInteger("id");
      const index = interaction.options.getInteger("index");
      const amount = interaction.options.getInteger("amount");
      const prediction2 = await getPrediction(guild, id2);
      const points2 = await getPoints(guild, interaction.user.id);

      let message2;
      if (!prediction2) {
        message2 =
          "Invalid input for **id**. The prediction could not be found. Use `/gamba` to list all the active predictions.";
      } else if (index <= 0 || index > prediction2.options.length) {
        message2 = `Invalid input for **index**. Enter an integer between **1** and **${prediction2.options.length}**.`;
      } else if (amount <= 0 || amount > points2) {
        message2 = `Invalid input for **amount**. Enter an integer between **1** and **${points2}**.`;
      }

      if (message2) {
        interaction.reply({
          content: message2,
          ephemeral: true,
        });
        break;
      }
      break;
    default:
      break;
  }
});

async function getPrediction(guild, id) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);
    return predictionsActiveData[id];
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return getPrediction(guild, id);
  }
}

async function getPredictions(guild) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);
    return predictionsActiveData;
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return getPredictions(guild);
  }
}

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

    // TODO call showing the prediction
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return addPrediction(guild);
  }
}

client.login(token);
