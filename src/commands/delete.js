/**
 * /delete command to delete a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { cancelPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");

  await cancelPrediction(interaction, id, true);
};
