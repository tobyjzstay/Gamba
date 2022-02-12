/**
 * /delete command which delete a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { deletePrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");

  await deletePrediction(interaction, id);
};
