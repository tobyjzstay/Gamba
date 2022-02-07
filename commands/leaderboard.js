/**
 * /leaderboard command which displays users with the most points.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { MessageEmbed, MessageAttachment } = require("discord.js");
const { path } = require("../config.json");
const { readData } = require("../helper");

module.exports = async function (interaction) {
  await interaction.guild.members.fetch(); // cache update
  let role = interaction.options.getRole("role");
  if (!role) role = interaction.guild.roles.everyone;
  let results = interaction.options.getInteger("results");
  if (!results) results = 10;
  else if (results < 1 || results > 25) {
    interaction.reply({
      content:
        "Invalid input for **results**. Enter a number between **1** and **25**.",
      ephemeral: true,
    });
    return;
  }
  const pointsData = await readData(interaction.guild, path.points);
  let roleMembers = {};
  role.members.forEach((member) => {
    if (member.user.bot) return; // hide bots from leaderboard
    let points = pointsData[member.user.id];
    if (!points) points = 0;
    const user = member.user;
    roleMembers[user] = points;
  });
  if (Object.keys(roleMembers).length === 0) {
    interaction.reply({
      content: `Could not find any users for ${role}`,
      ephemeral: true,
    });
    return;
  }

  // TODO sort by username as well?
  let leaderboard = Object.entries(roleMembers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, results);

  let userLeaderboard = "";
  let pointsLeaderboard = "";
  let prevRank;
  let prevPoints;
  for (let i = 0; i < leaderboard.length; i++) {
    if (userLeaderboard && pointsLeaderboard) {
      userLeaderboard += "\n";
      pointsLeaderboard += "\n";
    }
    const user = leaderboard[i][0];
    const points = leaderboard[i][1];
    let rank;
    if (points === prevPoints) rank = prevRank;
    else rank = i + 1;
    userLeaderboard += `**${rank}. **${user}`;
    pointsLeaderboard += `${points}`;
    prevRank = rank;
    prevPoints = points;
  }

  const attachment = new MessageAttachment("./images/founder.png");
  const embed = new MessageEmbed()
    .setColor("#9346ff")
    .setTitle(`Leaderboard`)
    .setDescription(`Top ${results} results for ${role}`)
    .setThumbnail("attachment://founder.png")
    .addFields(
      {
        name: "\u1CBC\u1CBCUser",
        value: `${userLeaderboard}`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      },
      {
        name: "Points",
        value: `${pointsLeaderboard}`,
        inline: true,
      }
    );

  await interaction.reply({
    allowedMentions: { users: [] },
    fetchReply: true,
    embeds: [embed],
    files: [attachment],
  });
};
