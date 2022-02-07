/**
 * Gamba command schema.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const DiscordJS = require("discord.js");

module.exports = [
  {
    name: "close",
    description: "Close a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "create",
    description: "Create a new prediction",
    options: [
      {
        name: "name",
        description: "Name of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "option1",
        description: "First possible outcome",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "option2",
        description: "Second possible outcome",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
      },
      {
        name: "minutes",
        description: "Number of minutes users have to predict",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "hours",
        description: "Number of hours users have to predict",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "days",
        description: "Number of days users have to predict",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "delete",
    description: "Delete a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "gamba",
    description: "Lists all active predictions",
  },
  {
    name: "end",
    description: "End a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "index",
        description: "Outcome index prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "leaderboard",
    description: "Show points leaderboard",
    options: [
      {
        name: "role",
        description: "Role to show leaderboard",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.ROLE,
      },
      {
        name: "results",
        description: "Number of results to show",
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
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "index",
        description: "Outcome index prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: "amount",
        description: "Number of points",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "prediction",
    description: "Show a prediction",
    options: [
      {
        name: "id",
        description: "ID of the prediction",
        required: true,
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  {
    name: "points",
    description: "Get points",
    options: [
      {
        name: "user",
        description: "User to get points",
        type: DiscordJS.Constants.ApplicationCommandOptionTypes.USER,
      },
    ],
  },
];
