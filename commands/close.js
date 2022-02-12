/**
 * /close command which closes predictions.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { setClosedPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");

  await setClosedPrediction(interaction, id);
};
