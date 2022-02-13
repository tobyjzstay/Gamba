/**
 * /create command which creates a new prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
const { path } = require("../config.json");
const { v4: uuidv4 } = require("uuid");
const { readData, initialiseGuild, showPrediction } = require("../helper");

module.exports = async function (interaction) {
  const name = interaction.options.getString("name");
  const option1 = interaction.options.getString("option1");
  const option2 = interaction.options.getString("option2");
  let minutes = interaction.options.getInteger("minutes");
  let hours = interaction.options.getInteger("hours");
  let days = interaction.options.getInteger("days");
  if (minutes === null) minutes = 0;
  if (hours === null) hours = 0;
  if (days === null) days = 0;

  let message;
  if (name.length > 100) {
    message =
      "Invalid input for **name**. Must be 100 characters or fewer in length.";
  } else if (option1.length > 32) {
    message =
      "Invalid input for **option1**. Must be 32 characters or fewer in length.";
  } else if (option2.length > 32) {
    message =
      "Invalid input for **option2**. Must be 32 characters or fewer in length.";
  } else if (minutes < 0 || minutes > 59)
    message =
      "Invalid input for **minutes**. Enter an integer between **0** and **59**.";
  else if (hours < 0 || hours > 23)
    message =
      "Invalid input for **hours**. Enter an integer between **0** and **23**.";
  else if (days < 0 || days > 365)
    message =
      "Invalid input for **days**. Enter an integer between **0** and **365**.";
  else if (minutes === 0 && hours === 0 && days === 0) minutes = 5;

  if (message) {
    interaction.reply({
      content: message,
      ephemeral: true,
    });
    return;
  }

  const created = new Date();
  const closes = new Date(created);
  closes.setMinutes(closes.getMinutes() + minutes);
  closes.setHours(closes.getHours() + hours);
  closes.setDate(closes.getDate() + days);

  const newPrediction = {
    uuid: uuidv4(),
    name: name,
    author: interaction.user.id,
    created: created,
    closes: closes,
    closed: false,
    options: [
      {
        option: option1,
        voters: {},
      },
      {
        option: option2,
        voters: {},
      },
    ],
  };

  await addPrediction(interaction, newPrediction);
};

async function addPrediction(interaction, prediction) {
  try {
    const predictionsActiveData = await readData(
      interaction.guild,
      path.predictionsActive
    );

    let updatedPredictionsActiveData = predictionsActiveData;
    let id;
    for (let i = 1; true; i++) {
      if (!updatedPredictionsActiveData[i]) {
        id = i;
        updatedPredictionsActiveData[id] = prediction;
        break;
      }
    }

    fs.writeFileSync(
      `${path.predictionsActive}${interaction.guild.id}.json`,
      JSON.stringify(updatedPredictionsActiveData, null, 2),
      "utf-8"
    );

    await showPrediction(interaction, id);
  } catch (err) {
    console.error(err);
    await initialiseGuild(interaction.guild);
    return await addPrediction(interaction.guild);
  }
}
