/**
 * /end command which allows a user to end the prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const { path } = require("../config.json");
const { readData, getPrediction } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const index = interaction.options.getInteger("index");
  const prediction = await getPrediction(interaction.guild, id);

  let message;
  if (!prediction) {
    message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
  } else if (
    prediction.author !== interaction.user &&
    !interaction.member.permissions.has("ADMINISTRATOR")
  ) {
    message = `You do not have permission. Only ${author} and server administrators can close the prediction **#${id}**.`;
  } else if (!prediction.closed) {
    message = `The prediction **#${id}** needs to be closed first before ending.`;
  } else if (index <= 0 || index > prediction.options.length) {
    message = `Invalid input for **index**. Enter an integer between **1** and **${prediction.options.length}**.`;
  }

  if (message) {
    interaction.reply({
      content: message,
      ephemeral: true,
    });
    return;
  }

  const winnerVoters = prediction.options[id - 1].voters;
  const totalPointsWon = Object.entries(winnerVoters).reduce(
    (p, i) => p + i[1],
    0
  );
  let totalPointsLost = 0;
  for (let i = 0; i < prediction.options; i++) {
    if (i + 1 === id) continue;
    totalPointsLost += Object.entries(prediction.options[i].voters).reduce(
      (p, i) => p + i[1],
      0
    );
  }

  let ratio = totalPointsLost / totalPointsWon;
  if (ratio < 1) ratio += 1;

  for (let winnerVoter in winnerVoters) {
    winnerVoters[winnerVoter] *= ratio;
  }

  setAllPoints(interaction.guild, winnerVoters);

  await interaction.reply({
    allowedMentions: { users: [] },
    content: `${interaction.user} ended the prediction **#${id}**.`,
  });
};

async function setAllPoints(guild, voters) {
  if (!voters) return;
  const pointsData = await readData(guild, path.points);
  let updatedPointsData = pointsData;
  for (let voter in voters) {
    updatedPointsData[voter] += voters[voter];
  }
  fs.writeFileSync(
    `${path.points}${guild.id}.json`,
    JSON.stringify(updatedPointsData, null, 2),
    "utf-8"
  );
}
