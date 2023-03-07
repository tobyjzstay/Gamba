/**
 * /end command which allows a user to end the prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { getPrediction } = require("../helper");

module.exports = async function (inter) {
    // check inter is of type CommandInteraction
    if (!inter instanceof DiscordJS.CommandInteraction) throw new Error("Invalid interaction type.");

    const interaction = inter;

    const id = interaction.options.getInteger("id");
    const index = interaction.options.getInteger("index");

    endPrediction(interaction, id, index, true);
};

async function endPrediction(interaction, id, index, reply) {
    const prediction = await getPrediction(interaction.guild, id);

    let message;
    if (!prediction) {
        message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/predictions\` to list all the active predictions.`;
    } else if (prediction.author !== interaction.user && !interaction.member.permissions.has("ADMINISTRATOR")) {
        message = `You do not have permission. Only ${author} and server administrators can close the prediction **#${id}**.`;
    } else if (!prediction.closed) {
        message = `The prediction **#${id}** needs to be closed first before ending. Use \`/close\` to close the prediction.`;
    } else if (index <= 0 || index > prediction.options.length) {
        message = `Invalid input for **index**. Enter an integer between **1** and **${prediction.options.length}**.`;
    }

    if (message) {
        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    const winnerVoters = prediction.options[index - 1].voters;
    const totalPointsWon = Object.entries(winnerVoters).reduce((p, i) => p + i[1], 0);
    let totalPointsLost = 0;
    for (let i = 0; i < prediction.options.length; i++) {
        if (i + 1 !== index)
            totalPointsLost += Object.entries(prediction.options[i].voters).reduce((p, i) => p + i[1], 0);
    }

    let ratio = totalPointsLost / totalPointsWon;

    for (let winnerVoter in winnerVoters) {
        winnerVoters[winnerVoter] = Math.round(winnerVoters[winnerVoter] * ratio);
    }

    // update the points
    await setAllPoints(interaction.guild, winnerVoters);

    // archive the prediction
    await archivePrediction(interaction.guild, id);

    const data = {
        allowedMentions: { users: [] },
        content: `${interaction.user} ended the prediction **#${id}**. The outcome was "${
            prediction.options[index - 1].option
        }" (**${index}**).`,
    };
    if (reply) await interaction.reply(data);
    else {
        const channel = await interaction.member.guild.channels.cache.get(interaction.channelId);
        await channel.send(data);
        await interaction.deferUpdate();
    }
    return;
}
