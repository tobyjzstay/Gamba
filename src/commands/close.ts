/**
 * /close command which closes predictions.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
const helper = require("../helper.js");

export type Prediction = {
    id: number;
    uuid: string;
    name: string;
    author: string;
    created: Date;
    closes: Date;
    closed: boolean;
    ended: boolean;
    outcomes: Outcome[];
};

type Outcome = {
    name: string;
    predictors: Predictor[];
};

type Predictor = {};

export async function closePrediction(interaction: any) {
    const id = interaction.options.getInteger("id");

    if (!id) throw new Error("No ID provided.");

    // TODO: should check if the prediction should be closed using isClosed(prediction))
    const prediction: Prediction = await helper.getPrediction(interaction.guild, id);
    if (!prediction) return; // prediction doesn't exist

    // check if the prediction is already closed
    if (prediction.closed) {
        await interaction.reply({
            content: `The prediction **#${id}** is already closed.`,
            ephemeral: true,
        });
        return;
    }

    // close the prediction
    setPredictionClosed(prediction);
    await interaction.reply({
        allowedMentions: { users: [] },
        content: `${interaction.user} closed the prediction **#${id}**.`,
    });
}

export function isClosed(prediction: Prediction) {
    if (!prediction.closed) {
        const timeLeft = prediction.closes.getTime() - new Date().getTime();
        if (timeLeft > 0) return false;
        setPredictionClosed(prediction);
    }
    return true;
}

function setPredictionClosed(prediction: Prediction) {
    prediction.closed = true;
    // TODO: update database
}
