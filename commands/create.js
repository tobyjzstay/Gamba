/**
 * /create command which creates a new prediction.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { MessageActionRow, MessageButton } = require("discord.js");
const { createPrediction } = require("../helper");
const { v4: uuidv4 } = require("uuid");

module.exports = async function (interaction) {
    const name = interaction.options.getString("name");
    const option1 = interaction.options.getString("option1");
    const option2 = interaction.options.getString("option2");

    let minutes = 0;
    let hours = 0;
    let days = 0;

    const uuid = uuidv4();

    let message;
    if (name.length > 100) {
        message = "Invalid input for **name**. Must be 100 characters or fewer in length.";
    } else if (option1.length > 32) {
        message = "Invalid input for **option1**. Must be 32 characters or fewer in length.";
    } else if (option2.length > 32) {
        message = "Invalid input for **option2**. Must be 32 characters or fewer in length.";
    } else if (minutes < 0 || minutes > 59)
        message = "Invalid input for **minutes**. Enter an integer between **0** and **59**.";
    else if (hours < 0 || hours > 23)
        message = "Invalid input for **hours**. Enter an integer between **0** and **23**.";
    else if (days < 0 || days > 7) message = "Invalid input for **days**. Enter an integer between **0** and **7**.";
    else if (minutes === 0 && hours === 0 && days === 0) {
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`create_${uuid}_${name}_${option1}_${option2}_${1000 * 60 * 5}`)
                .setLabel(`5 minutes`)
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(`create_${uuid}_${name}_${option1}_${option2}_${1000 * 60 * 15}`)
                .setLabel(`15 minutes`)
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(`create_${uuid}_${name}_${option1}_${option2}_${1000 * 60 * 60}`)
                .setLabel(`1 hour`)
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(`create_${uuid}_${name}_${option1}_${option2}_${1000 * 60 * 60 * 6}`)
                .setLabel(`6 hours`)
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId(`create_${uuid}_${name}_${option1}_${option2}_${1000 * 60 * 60 * 24}`)
                .setLabel(`1 day`)
                .setStyle("PRIMARY")
        );

        await interaction.reply({
            content: `Select the time period for the prediction \"${name}\" below or use \`/create <name> <option1> <option2> [minutes] [hours] [days]\`.`,
            ephemeral: true,
            components: [row],
        });
        return;
    }

    if (message) {
        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    await createPrediction(interaction, uuid, name, option1, option2, minutes, hours, days);
};
