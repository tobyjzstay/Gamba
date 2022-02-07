/**
 * /create command which creates a new prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { path } = require("../config.json");
const { readData, initialiseGuild } = require("../helper");

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
  let closes = created;
  closes.setDate(closes.getMinutes() + minutes);
  closes.setDate(closes.getHours() + hours);
  closes.setDate(closes.getDate() + days);

  const newPrediction = {
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

  await addPrediction(interaction.guild, newPrediction);
};

async function addPrediction(guild, prediction) {
  try {
    const predictionsActiveData = await readData(guild, path.predictionsActive);

    let updatedPredictionsActiveData = predictionsActiveData;
    for (let i = 1; true; i++) {
      if (!updatedPredictionsActiveData[i]) {
        updatedPredictionsActiveData[i] = prediction;
        break;
      }
    }

    fs.writeFileSync(
      `${path.predictionsActive}${guild.id}.json`,
      JSON.stringify(updatedPredictionsActiveData, null, 2),
      "utf-8"
    );

    // TODO call showing the prediction
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return addPrediction(guild);
  }
}
