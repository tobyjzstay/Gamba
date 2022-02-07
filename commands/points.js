/**
 * /points command which displays the amount of points a user has.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { getPoints } = require("../helper");

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
