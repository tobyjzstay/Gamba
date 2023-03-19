/**
 * /predictions command.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder().setName("predictions").setDescription("Display the list of predictions."),
    async execute(interaction: CommandInteraction) {
        interaction.reply("TODO");
    },
} as Command;
