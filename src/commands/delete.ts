/**
 * /delete command.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete a prediction. Points are refunded if the prediction has not ended.")
        .addIntegerOption((option) => option.setName("id").setDescription("Prediction ID").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        interaction.reply("TODO");
    },
} as Command;
