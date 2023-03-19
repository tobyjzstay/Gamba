/**
 * /end command.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("end")
        .setDescription("End a prediction. Points are distributed to users who made the correct outcome.")
        .addIntegerOption((option) => option.setName("id").setDescription("Prediction ID").setRequired(true))
        .addIntegerOption((option) =>
            option.setName("index").setDescription("Correct outcome index").setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        interaction.reply("TODO");
    },
} as Command;
