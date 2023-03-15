/**
 * /end command which allows a user to end the prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

import { Prediction } from "./close";

const helper = require("../helper.js");

export async function endPrediction(interaction: any) {
    const id = interaction.options.getInteger("id");
    const index = interaction.options.getInteger("index");

    if (!id) throw new Error("No ID provided.");
    else if (!index) throw new Error("No ID provided.");

    const prediction: Prediction = await helper.getPrediction(interaction.guild, id);
    if (!prediction) return; // prediction doesn't exist

    // check if the prediction has already ended
    if (prediction.ended) {
        await interaction.reply({ content: `The prediction **#${id}** has already ended.`, ephemeral: true });
        return;
    }

    // end the prediction
    setPredictionEnded(prediction, index);

    const data = {
        allowedMentions: { users: [] },
        content: `${interaction.user} ended the prediction **#${id}**. The outcome was "${
            prediction.outcomes[index - 1].name
        }" (**${index}**).`,
    };

    const channel = await interaction.member.guild.channels.cache.get(interaction.channelId);
    await channel.send(data);
    await interaction.deferUpdate();
}

function setPredictionEnded(prediction: Prediction, index: number) {
    const correctOutcome = prediction.outcomes[index - 1];
    // const pool = correctOutcome.predictors
    // const payout = prediction.outcomes

    // const ratio = pool / payout;

    // TODO: call function which takes outcome and ratio to payout
    // TODO: archive the prediction

    prediction.ended = true;
    // TODO: update database
}
