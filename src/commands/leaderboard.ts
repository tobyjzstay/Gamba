/**
 * /points command which displays the amount of points a user has.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";

export default {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Display the users with the most points.")
        .addRoleOption((option) => option.setName("role").setDescription("Role to filter by")),
    async execute(interaction: CommandInteraction) {
        await interaction.reply("TODO");
    },
} as Command;
