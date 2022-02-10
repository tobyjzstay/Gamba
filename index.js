/**
 * Gamba Application.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const {
  Client,
  Intents,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, token } = require("./config.json");
const {
  initialiseGuild,
  getPoints,
  addAllPoints,
  getPrediction,
  formatNumber,
  predictPoints,
} = require("./helper");
const schema = require("./schema");

const commands = {};
const normalizedPath = require("path").join(__dirname, "commands");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (command) {
    commands[command.slice(0, -3)] = require("./commands/" + command);
  });

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});
const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), {
      body: schema,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("ready", () => {
  client.user.setActivity("/gamba", { type: "LISTENING" });
  setInterval(() => {
    client.guilds.cache.forEach(async (guild) => {
      await addAllPoints(guild, 10);
    });
  }, 60 * 1000 * 5); // runs every 5 minutes
});

client.on("guildCreate", async (guild) => {
  initialiseGuild(guild);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.user.bot || !interaction.channel) return;

  if (interaction.isButton()) {
    const args = interaction.customId.split("_");
    switch (args.length) {
      case 3:
        const points = await getPoints(interaction.guild, interaction.user.id);
        const prediction = await getPrediction(interaction.guild, args[1]);

        if (!prediction || prediction.uuid !== args[0]) {
          interaction.reply({
            content:
              (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/gamba\` to list all the active predictions.`),
            ephemeral: true,
          });
          return;
        }

        const row = new MessageActionRow();
        const allocation = [5, 10, 25, 50, 100];
        const pointsAllocation = [];

        for (let i in allocation) {
          pointsAllocation.push(Math.round(points * (allocation[i] / 100)));
          if (i < allocation.length - 1) {
            row.addComponents(
              new MessageButton()
                .setDisabled(pointsAllocation[i] ? false : true)
                .setCustomId(`${interaction.customId}_${pointsAllocation[i]}`)
                .setLabel(
                  `Predict ${allocation[i]}% (${formatNumber(
                    pointsAllocation[i]
                  )})`
                )
                .setStyle(args[2] % 2 ? "PRIMARY" : "SECONDARY")
            );
          } else {
            row.addComponents(
              new MessageButton()
                .setDisabled(pointsAllocation[i] ? false : true)
                .setCustomId(`${interaction.customId}_${pointsAllocation[i]}`)
                .setLabel(`ALL IN`)
                .setStyle("DANGER")
            );
          }
        }

        await interaction.reply({
          content: `Predicting **#${args[1]}** index **${
            args[2]
          }**. You have **${formatNumber(points)}** point${
            points === 1 ? "" : "s"
          }. Select a percentage of points below or use \`/predict ${args[1]} ${
            args[2]
          } <amount>\`.`,
          ephemeral: true,
          components: [row],
        });
        break;
      case 4:
        const prediction2 = await getPrediction(interaction.guild, args[1]);
        await predictPoints(
          interaction,
          prediction2,
          args[1],
          new Number(args[2]),
          new Number(args[3])
        );
      default:
        break;
    }
  } else if (interaction.isCommand() && commands[interaction.commandName])
    commands[interaction.commandName](interaction);
});

client.login(token);
