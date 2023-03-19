/**
 * /prediction command.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("prediction")
        .setDescription("Display the details of a predictions.")
        .addIntegerOption((option) => option.setName("id").setDescription("Prediction ID").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        interaction.reply("TODO");
    },
} as Command;
