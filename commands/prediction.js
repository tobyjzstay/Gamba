/**
 * /prediction command which display the details of a prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const {
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { path } = require("../config.json");
const { readData, initialiseGuild } = require("../helper");

module.exports = async function (interaction) {
  const id = interaction.options.getInteger("id");
  const prediction = await getPrediction(interaction.guild, id);
  if (!prediction) {
    interaction.reply({
      content:
        "Invalid input for **id**. The prediction could not be found. Use `/gamba` to list all the active predictions.",
      ephemeral: true,
    });
    return;
  }

  const option1Image = new MessageAttachment("./images/option1.png");
  const option2Image = new MessageAttachment("./images/option2.png");
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setDisabled(prediction.closed)
      .setCustomId("option1")
      .setLabel(`Predict "${prediction.options[0].option}"`)
      .setStyle("PRIMARY"),
    new MessageButton()
      .setDisabled(prediction.closed)
      .setCustomId("option2")
      .setLabel(`Predict "${prediction.options[1].option}"`)
      .setStyle("SECONDARY"),
    new MessageButton()
      .setCustomId("closeEnd")
      .setLabel(prediction.closed ? "End" : "Close")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId("delete")
      .setLabel("Delete")
      .setStyle("DANGER")
  );

  const closes1 = new Date(prediction.closes);

  const member = await interaction.guild.members.fetch(prediction.author); // cache update
  const embedTitle = new MessageEmbed()
    .setColor("#404040")
    .setTitle(`${prediction.name}`)
    .setDescription(
      prediction.closed
        ? "Predictions closed"
        : `Prediction closes at ${closes1
            .toLocaleTimeString("en-NZ")
            .toUpperCase()}, ${closes1.toLocaleDateString("en-NZ")}`
    )
    .setAuthor({
      name: `${member.user.tag}`,
      iconURL: `${member.user.displayAvatarURL()}`,
    });

  const voters1 = prediction.options[0].voters;
  const totalPoints1 = Object.entries(voters1).reduce((p, i) => p + i[1], 0);

  const topVoters1 = Object.entries(voters1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  const topVoter1 = topVoters1[0]
    ? await interaction.guild.members.fetch(topVoters1[0][0])
    : null;

  const voters2 = prediction.options[1].voters;
  const totalPoints2 = Object.entries(voters2).reduce((p, i) => p + i[1], 0);

  const topVoters2 = Object.entries(voters2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  const topVoter2 = topVoters2[0]
    ? await interaction.guild.members.fetch(topVoters2[0][0])
    : null;

  const totalVoters1 = Object.keys(voters1).length;
  const totalVoters2 = Object.keys(voters2).length;
  const embed1 = new MessageEmbed()
    .setColor("#387aff")
    .setTitle(
      `${prediction.options[0].option}${
        totalVoters1 + totalVoters2
          ? ` (${Math.round(
              (totalPoints1 / (totalPoints1 + totalPoints2)) * 100
            )}%)`
          : ``
      }`
    )
    .setThumbnail("attachment://option1.png")
    .addFields(
      {
        name: "\u200b",
        value: `:yellow_circle: **Total Points:** ${totalPoints1}
            :trophy: **Return Ratio:** 1:${
              totalPoints2 / totalPoints1 < 1
                ? Math.round((totalPoints2 / totalPoints1) * 100) / 100 + 1
                : Math.round((totalPoints2 / totalPoints1) * 100) / 100
            }
            :family_man_girl: **Total Voters:** ${
              Object.keys(prediction.options[0].voters).length
            }
            :medal: ${topVoter1 ? `${topVoter1}: ${topVoters1[0][1]}` : "-"}`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      }
    );
  const embed2 = new MessageEmbed()
    .setColor("#f5009b")
    .setTitle(
      `${prediction.options[1].option}${
        totalVoters1 + totalVoters2
          ? ` (${Math.round(
              (totalPoints2 / (totalPoints1 + totalPoints2)) * 100
            )}%)`
          : ``
      }`
    )
    .setThumbnail("attachment://option2.png")
    .addFields(
      {
        name: "\u200b",
        value: `:yellow_circle: **Total Points:** ${totalPoints2}
            :trophy: **Return Ratio:** 1:${
              totalPoints1 / totalPoints2 < 1
                ? Math.round((totalPoints1 / totalPoints2) * 100) / 100 + 1
                : Math.round((totalPoints1 / totalPoints2) * 100) / 100
            }
            :family_man_girl: **Total Voters:** ${
              Object.keys(prediction.options[1].voters).length
            }
            :medal: ${topVoter2 ? `${topVoter2}: ${topVoters2[0][1]}` : "-"}`,
        inline: true,
      },
      {
        name: "\u200b",
        value: "\u200b",
        inline: true,
      }
    );

  await interaction.reply({
    allowedMentions: { users: [] },
    fetchReply: true,
    embeds: [embedTitle, embed1, embed2],
    files: [option1Image, option2Image],
    components: [row],
  });
};

async function getPrediction(guild, id) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);
    return predictionsActiveData[id];
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return getPrediction(guild, id);
  }
}
