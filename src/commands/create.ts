/**
 * /points command which displays the amount of points a user has.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("create")
        .setDescription("Create a new prediction.")
        .addStringOption((option) => option.setName("name").setDescription("Name of the prediction").setRequired(true))
        .addStringOption((option) => option.setName("outcome1").setDescription("Outcome 1").setRequired(true))
        .addStringOption((option) => option.setName("outcome2").setDescription("Outcome 2").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        interaction.reply("TODO");
        // if (interaction.commandName !== "create") return;
        // const modal = new ModalBuilder().setCustomId("create").setTitle("Create Prediction");
        // const nameInput = new TextInputBuilder()
        //     .setCustomId("nameInput")
        //     .setLabel("Name the prediction")
        //     .setStyle(TextInputStyle.Short)
        //     .setRequired(true);
        // const outcome1Input = new TextInputBuilder()
        //     .setCustomId("outcome1Input")
        //     .setLabel("Outcome 1")
        //     .setStyle(TextInputStyle.Short)
        //     .setRequired(true);
        // const outcome2Input = new TextInputBuilder()
        //     .setCustomId("outcome2Input")
        //     .setLabel("Outcome 2")
        //     .setStyle(TextInputStyle.Short)
        //     .setRequired(true);
        // const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput);
        // const secondActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(outcome1Input);
        // const thirdActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(outcome2Input);
        // modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
        // await interaction.showModal(modal);
    },
} as Command;
