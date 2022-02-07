/**
 * /predict command which allows a user to predict points on a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const { path } = require("../config.json");
const { readData, getPoints, getPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const index = interaction.options.getInteger("index");
  const amount = interaction.options.getInteger("amount");
  const prediction = await getPrediction(interaction.guild, id);
  const points = await getPoints(interaction.guild, interaction.user.id);

  let message;
  if (!prediction) {
    message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
  } else if (index <= 0 || index > prediction.options.length) {
    message = `Invalid input for **index**. Enter an integer between **1** and **${prediction.options.length}**.`;
  } else if (amount <= 0 || amount > points) {
    message = `Invalid input for **amount**. Enter an integer between **1** and **${points}**.`;
  } else if (prediction.closed) {
    message = `Prediction ID **#${id}** is closed.`;
  }

  for (let option in prediction.options) {
    const name = prediction.options[option].option;
    const voters = prediction.options[option].voters;
    const opt = new Number(option) + 1;
    if (voters[interaction.user.id] && opt !== index) {
      message = `You have already predicted "${name}" (**${opt}**) for **${
        voters[interaction.user.id]
      }** points.`;
      break;
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
  let predicted = prediction.options[index - 1].voters[interaction.user.id];
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
      prediction.options[id - 1].option
    }" (**${index}**) for **${amount}** point${
      amount === 1 ? "" : "s"
    } (**${predicted}** point${predicted === 1 ? "" : "s"} total).`,
    ephemeral: true,
  });
};

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
