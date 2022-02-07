/**
 * /gamba command which lists all the active predictions.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { MessageEmbed, MessageAttachment } = require("discord.js");
const { path } = require("../config.json");
const { readData, initialiseGuild } = require("../helper");

module.exports = async function (interaction) {
  const predictionData = await getPredictions(interaction.guild);
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
    return;
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
};

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
