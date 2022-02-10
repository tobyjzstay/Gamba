/**
 * /predict command which allows a user to predict points on a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const { getPrediction, predictPoints } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const index = interaction.options.getInteger("index");
  const amount = interaction.options.getInteger("amount");
  const prediction = await getPrediction(interaction.guild, id);

  await predictPoints(interaction, prediction, id, index, amount);
};
