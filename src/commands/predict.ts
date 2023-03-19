/**
 * /predict command.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("predict")
        .setDescription("Predict the outcome of a prediction.")
        .addIntegerOption((option) => option.setName("id").setDescription("Prediction ID").setRequired(true))
        .addIntegerOption((option) => option.setName("index").setDescription("Outcome index").setRequired(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("Amount of points").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        interaction.reply("TODO");
    },
} as Command;
