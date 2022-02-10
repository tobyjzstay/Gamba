/**
 * Helper commands used across commands.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const {
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const fs = require("fs");
const { path } = require("./config.json");

module.exports = {
  readData,
  initialiseGuild,
  getPoints,
  addAllPoints,
  getPrediction,
  showPrediction,
  setAllPoints,
  archivePrediction,
  predictPoints,
  formatNumber,
};

async function readData(guild, path) {
  return await JSON.parse(
    fs.readFileSync(`${path}${guild.id}.json`, "utf-8", (err) => {
      console.error(err);
    })
  );
}

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
      "[]",
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
    return await getPoints(guild, userId);
  }
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
    return await addAllPoints(guild, increment);
  }
}

async function getPrediction(guild, id) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);
    return predictionsActiveData[id];
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return await getPrediction(guild, id);
  }
}

async function showPrediction(interaction, id) {
  const prediction = await getPrediction(interaction.guild, id);
  const option1Image = new MessageAttachment("./images/option1.png");
  const option2Image = new MessageAttachment("./images/option2.png");
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setDisabled(prediction.closed)
      .setCustomId(`${prediction.uuid}_${id}_1`)
      .setLabel(`Predict "${prediction.options[0].option}"`)
      .setStyle("PRIMARY"),
    new MessageButton()
      .setDisabled(prediction.closed)
      .setCustomId(`${prediction.uuid}_${id}_2`)
      .setLabel(`Predict "${prediction.options[1].option}"`)
      .setStyle("SECONDARY"),
    new MessageButton()
      .setCustomId("closeEnd") // TODO
      .setLabel(prediction.closed ? "End" : "Close")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId("delete") // TODO
      .setLabel("Delete")
      .setStyle("DANGER")
  );

  const closes1 = new Date(prediction.closes);

  const member = await interaction.guild.members.fetch(prediction.author);
  const embedTitle = new MessageEmbed()
    .setColor("#404040")
    .setTitle(`#${id}: ${prediction.name}`)
    .setDescription(
      prediction.closed ? "Predictions closed" : `` //`Prediction closes at ${closes1.toLocaleTimeString("en-NZ").toUpperCase()}, ${closes1.toLocaleDateString("en-NZ")}`
    )
    .setAuthor({
      name: `${member.user.tag}`,
      iconURL: `${member.user.displayAvatarURL()}`,
    })
    .setFooter({
      text: `${prediction.uuid}`,
    });

  const voters1 = prediction.options[0].voters;
  const totalPoints1 = Object.entries(voters1).reduce((p, i) => p + i[1], 0);

  const topVoters1 = Object.entries(voters1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  const topVoter1 = topVoters1[0]
    ? await interaction.guild.members.fetch(topVoters1[0][0])
    : null;

  const voters2 = prediction.options[1].voters;
  const totalPoints2 = Object.entries(voters2).reduce((p, i) => p + i[1], 0);

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
        value: `:yellow_circle: **Total Points:** ${formatNumber(totalPoints1)}
            :trophy: **Return Ratio:** 1:${
              totalPoints2 / totalPoints1 < 1
                ? Math.round((totalPoints2 / totalPoints1) * 100) / 100 + 1
                : Math.round((totalPoints2 / totalPoints1) * 100) / 100
            }
            :family_man_girl: **Total Voters:** ${
              Object.keys(prediction.options[0].voters).length
            }
            :medal: ${
              topVoter1
                ? `${topVoter1}: ${formatNumber(topVoters1[0][1])}`
                : "-"
            }`,
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
        value: `:yellow_circle: **Total Points:** ${formatNumber(totalPoints2)}
            :trophy: **Return Ratio:** 1:${
              totalPoints1 / totalPoints2 < 1
                ? Math.round((totalPoints1 / totalPoints2) * 100) / 100 + 1
                : Math.round((totalPoints1 / totalPoints2) * 100) / 100
            }
            :family_man_girl: **Total Voters:** ${
              Object.keys(prediction.options[1].voters).length
            }
            :medal: ${
              topVoter2
                ? `${topVoter2}: ${formatNumber(topVoters2[0][1])}`
                : "-"
            }`,
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
}

async function setAllPoints(guild, voters) {
  if (!voters) return;
  const pointsData = await readData(guild, path.points);
  let updatedPointsData = pointsData;
  for (let voter in voters) {
    updatedPointsData[voter] += voters[voter];
  }
  fs.writeFileSync(
    `${path.points}${guild.id}.json`,
    JSON.stringify(updatedPointsData, null, 2),
    "utf-8"
  );
}

async function archivePrediction(guild, id) {
  try {
    const prediction = await getPrediction(guild, id);
    const predictionsArchiveData = await readData(
      guild,
      path.predictionsArchive
    );
    let updatedPredictionsArchiveData = predictionsArchiveData;
    updatedPredictionsArchiveData.push(prediction);

    fs.writeFileSync(
      `${path.predictionsArchive}${guild.id}.json`,
      JSON.stringify(updatedPredictionsArchiveData, null, 2),
      "utf-8"
    );

    const predictionsActiveData = await readData(guild, path.predictionsActive);
    let updatedPredictionsActiveData = predictionsActiveData;
    delete updatedPredictionsActiveData[id];
    fs.writeFileSync(
      `${path.predictionsActive}${guild.id}.json`,
      JSON.stringify(updatedPredictionsActiveData, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return await archivePrediction(guild, id);
  }
}

async function predictPoints(interaction, prediction, id, index, amount) {
  const points = await getPoints(interaction.guild, interaction.user.id);
  let message;
  if (!prediction) {
    message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
  } else if (index <= 0 || index > prediction.options.length) {
    message = `Invalid input for **index**. Enter an integer between **1** and **${prediction.options.length}**.`;
  } else if (amount <= 0 || amount > points) {
    message = `You don't have enough points. You have **${formatNumber(
      points
    )}** point${points === 1 ? "" : "s"}.`;
  } else if (prediction.closed) {
    message = `The prediction **#${id}** is closed.`;
  } else {
    for (let option in prediction.options) {
      const name = prediction.options[option].option;
      const voters = prediction.options[option].voters;
      const opt = new Number(option) + 1;
      if (voters[interaction.user.id] && opt != index) {
        message = `You have already predicted "${name}" (**${opt}**) for **${formatNumber(
          voters[interaction.user.id]
        )}** points.`;
        break;
      }
    }
  }

  if (message) {
    interaction.reply({
      content: message,
      ephemeral: true,
    });
    return;
  }

  // calculate new user prediction
  let predicted = new Number(
    prediction.options[index - 1].voters[interaction.user.id]
  );
  if (!predicted) predicted = 0;
  predicted += amount;

  // deduct points from user
  setPoints(interaction.guild, interaction.user.id, points - amount);

  // update user prediction
  setUserPrediction(
    interaction.guild,
    interaction.user.id,
    id,
    index - 1,
    predicted
  );

  await interaction.reply({
    allowedMentions: { users: [] },
    content: `${interaction.user} has predicted "${
      prediction.options[index - 1].option
    }" (**${index}**) for **${formatNumber(amount)}** point${
      amount === 1 ? "" : "s"
    } (**${formatNumber(predicted)}** point${
      predicted === 1 ? "" : "s"
    } total).`,
  });
}

async function setPoints(guild, userId, points) {
  const pointsData = await readData(guild, path.points);
  let updatedPointsData = pointsData;
  updatedPointsData[userId] = points;
  fs.writeFileSync(
    `${path.points}${guild.id}.json`,
    JSON.stringify(updatedPointsData, null, 2),
    "utf-8"
  );
}

async function setUserPrediction(guild, userId, id, index, amount) {
  const predictionsActiveData = await readData(guild, path.predictionsActive);
  let updatedPredictionsActiveData = predictionsActiveData;
  updatedPredictionsActiveData[id].options[index].voters[userId] = amount;
  fs.writeFileSync(
    `${path.predictionsActive}${guild.id}.json`,
    JSON.stringify(updatedPredictionsActiveData, null, 2),
    "utf-8"
  );
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
