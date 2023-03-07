/**
 * Gamba command schema.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const DiscordJS = require("discord.js");

module.exports = [
    {
        name: "predictions",
        description: "Display the list of predictions.",
    },
    {
        name: "prediction",
        description: "Display the details of a prediction.",
        options: [
            {
                name: "id",
                description: "Prediction ID",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
        ],
    },
    {
        name: "predict",
        description: "Predict with points",
        options: [
            {
                name: "id",
                description: "Prediction ID",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
            {
                name: "index",
                description: "Outcome index",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
            {
                name: "amount",
                description: "Amount of points",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
        ],
    },
    {
        name: "create",
        description: "Create a new prediction.",
        options: [
            {
                name: "name",
                description: "Name of the prediction",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
            },
            {
                name: "outcome1",
                description: "Outcome 1",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
            },
            {
                name: "outcome2",
                description: "Outcome 2",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
            },
        ],
    },
    {
        name: "close",
        description: "Close a prediction. No new predictions can be made.",
        options: [
            {
                name: "id",
                description: "Prediction ID",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
        ],
    },
    {
        name: "end",
        description: "End a prediction. Points are distributed to users who made the correct outcome.",
        options: [
            {
                name: "id",
                description: "Prediction ID",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
            {
                name: "index",
                description: "Correct outcome index",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
        ],
    },
    {
        name: "delete",
        description: "Delete a prediction. Points are refunded if the prediction has not ended.",
        options: [
            {
                name: "id",
                description: "Prediction ID",
                required: true,
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
            },
        ],
    },
    {
        name: "points",
        description: "Display the points a user has.",
        options: [
            {
                name: "user",
                description: "User to display points for",
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.USER,
            },
        ],
    },
    {
        name: "leaderboard",
        description: "Display the users with the most points.",
        options: [
            {
                name: "role",
                description: "Role to filter by",
                type: DiscordJS.Constants.ApplicationCommandOptionTypes.ROLE,
            },
        ],
    },
];
