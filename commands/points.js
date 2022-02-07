/**
 * /points command which displays the amount of points a user has.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { path } = require("../config.json");
const { readData, initialiseGuild } = require("../helper");

module.exports = async function (interaction) {
  let user = interaction.options.getUser("user");
  if (!user) user = interaction.user;
  let points = await getPoints(interaction.guild, user.id);
  if (!points) points = 0;
  await interaction.reply({
    allowedMentions: { users: [] },
    content: `${user} has ${points} point${points === 1 ? "" : "s"}.`,
    fetchReply: true,
  });
};

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
