/**
 * /prediction command which display the details of a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { path } = require("../config.json");
const { readData, initialiseGuild, showPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const prediction = await getPrediction(interaction.guild, id);
  if (!prediction) {
    await interaction.reply({
      content:
        (message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`),
      ephemeral: true,
    });
    return;
  }
  await showPrediction(interaction, id, true);
};

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
