/**
 * /delete command which delete a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { getPrediction, setAllPoints, archivePrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const prediction = await getPrediction(interaction.guild, id);

  let message;
  if (!prediction) {
    message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
  } else if (
    prediction.author !== interaction.user &&
    !interaction.member.permissions.has("ADMINISTRATOR")
  ) {
    message = `You do not have permission. Only ${author} and server administrators can delete the prediction **#${id}**.`;
  }

  if (message) {
    interaction.reply({
      content: message,
      ephemeral: true,
    });
    return;
  }

  const refundVoters = {};
  for (let i = 0; i < prediction.options.length; i++) {
    const voters = prediction.options[i].voters;
    for (let voter in voters) {
      refundVoters[voter] = voters[voter];
    }
  }

  // update the points
  await setAllPoints(interaction.guild, refundVoters);

  // archive the prediction
  await archivePrediction(interaction.guild, id);

  await interaction.reply({
    allowedMentions: { users: [] },
    content: `${interaction.user} deleted the prediction **#${id}**.`,
  });
};
