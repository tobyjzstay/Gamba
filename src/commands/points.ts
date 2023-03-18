/**
 * /points command which displays the amount of points a user has.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("points")
        .setDescription("Display the points a user has.")
        .addUserOption((option) => option.setName("user").setDescription("The user to display points for")),
    async execute(interaction: CommandInteraction) {
        await interaction.reply("// TODO: implement");
    },
} as Command;
