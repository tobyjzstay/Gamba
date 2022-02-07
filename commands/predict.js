/**
 * /predict command which allows a user to predict points on a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { path } = require("../config.json");
const { readData, initialiseGuild } = require("../helper");

module.exports = async function (interaction) {
  const id2 = interaction.options.getInteger("id");
  const index = interaction.options.getInteger("index");
  const amount = interaction.options.getInteger("amount");
  const prediction2 = await getPrediction(interaction.guild, id2);
  const points2 = await getPoints(interaction.guild, interaction.user.id);

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
    return;
  }
};

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
