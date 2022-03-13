/**
 * /end command which allows a user to end the prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { endPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const index = interaction.options.getInteger("index");

  endPrediction(interaction, id, index, true);
};
