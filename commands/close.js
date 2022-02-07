/**
 * /close command which closes predictions.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const { path } = require("../config.json");
const { readData, getPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const prediction = await getPrediction(interaction.guild, id);
  const author = await interaction.guild.members.fetch(prediction.author);

  let message;
  if (!prediction) {
    message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
  } else if (
    prediction.author !== interaction.user &&
    !interaction.member.permissions.has("ADMINISTRATOR")
  ) {
    message = `You do not have permission. Only ${author} and server administrators can close the prediction **#${id}**.`;
  } else if (prediction.closed) {
    message = `The prediction **#${id}** is already closed.`;
  }

  if (message) {
    interaction.reply({
      content: message,
      ephemeral: true,
    });
    return;
  }

  closePrediction(interaction.guild, id);

  await interaction.reply({
    allowedMentions: { users: [] },
    content: `${interaction.user} closed the prediction **#${id}**.`,
    ephemeral: true,
  });
};

async function closePrediction(guild, id) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);
    let updatedPredictionsActiveData = predictionsActiveData;
    updatedPredictionsActiveData[id].closed = true;
    fs.writeFileSync(
      `${path.predictionsActive}${guild.id}.json`,
      JSON.stringify(updatedPredictionsActiveData, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return closePrediction(guild, id);
  }
}
