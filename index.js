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
  predictPoints,
  setClosedPrediction,
  endPrediction,
  deletePrediction,
  formatNumber,
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

        if (isNaN(args[2])) {
          switch (args[2]) {
            case "end":
              const row = new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId(`${prediction.uuid}_${args[1]}_end_1`)
                  .setLabel(`Prediction "${prediction.options[0].option}"`)
                  .setStyle("PRIMARY"),
                new MessageButton()
                  .setCustomId(`${prediction.uuid}_${args[1]}_end_2`)
                  .setLabel(`Prediction "${prediction.options[1].option}"`)
                  .setStyle("SECONDARY")
              );

              await interaction.reply({
                content: `Ending prediction **#${args[1]}**. Select the prediction that won below or use \`/end ${args[1]} <index>\`.`,
                ephemeral: true,
                components: [row],
              });
              break;
            case "close":
              await setClosedPrediction(interaction, args[1]);
              break;
            case "delete":
              const row2 = new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId(`${prediction.uuid}_${args[1]}_delete_1`)
                  .setLabel(`Delete "${prediction.name}"`)
                  .setStyle("DANGER")
              );

              await interaction.reply({
                content: `Are you sure you want to delete prediction **#${args[1]}**? All points will be refunded.`,
                ephemeral: true,
                components: [row2],
              });
              break;
            default:
              break;
          }
          break;
        } else {
          const row = new MessageActionRow();
          const allocation = [5, 10, 25, 50, 100];
          const pointsAllocation = [];

          for (let i in allocation) {
            pointsAllocation.push(Math.round(points * (allocation[i] / 100)));
            if (i < allocation.length - 1) {
              row.addComponents(
                new MessageButton()
                  .setDisabled(pointsAllocation[i] ? false : true)
                  .setCustomId(
                    `${interaction.customId}_${allocation[i]}_${pointsAllocation[i]}`
                  )
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
                  .setCustomId(
                    `${interaction.customId}_allIn_${pointsAllocation[i]}`
                  )
                  .setLabel(`ALL IN`)
                  .setStyle("DANGER")
              );
            }
          }

          await interaction.reply({
            content: `Predicting **#${args[1]}** "${
              prediction.options[args[2] - 1].option
            }" (**${args[2]}**). You have **${formatNumber(points)}** point${
              points === 1 ? "" : "s"
            }. Select a percentage of points below or use \`/predict ${
              args[1]
            } ${args[2]} <amount>\`.`,
            ephemeral: true,
            components: [row],
          });
        }
        break;
      case 4:
        const prediction22 = await getPrediction(interaction.guild, args[1]);

        if (!prediction22 || prediction22.uuid !== args[0]) {
          interaction.reply({
            content:
              (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/gamba\` to list all the active predictions.`),
            ephemeral: true,
          });
          return;
        }

        switch (args[2]) {
          case "end":
            await endPrediction(interaction, args[1], args[2]);
            break;
          case "delete":
            await deletePrediction(interaction, args[1]);
            break;
          default:
            break;
        }
        break;
      case 5:
        if (isNaN(args[3])) {
          switch (args[3]) {
            case "allIn":
              const prediction3 = await getPrediction(
                interaction.guild,
                args[1]
              );

              if (!prediction3 || prediction3.uuid !== args[0]) {
                interaction.reply({
                  content:
                    (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/gamba\` to list all the active predictions.`),
                  ephemeral: true,
                });
                return;
              }
              const row3 = new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId(
                    `${prediction3.uuid}_${args[1]}_${args[2]}_100_${args[4]}`
                  )
                  .setLabel(`Predict 100% (${formatNumber(args[4])})`)
                  .setStyle("DANGER")
              );

              await interaction.reply({
                content: `Predicting **#${args[1]}** "${
                  prediction3.options[args[2] - 1].option
                }" (**${args[2]}**). Are you sure you want to go **ALL IN**?`,
                ephemeral: true,
                components: [row3],
              });
              break;
            default:
              break;
          }
        } else {
          const prediction2 = await getPrediction(interaction.guild, args[1]);

          if (!prediction2 || prediction2.uuid !== args[0]) {
            interaction.reply({
              content:
                (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/gamba\` to list all the active predictions.`),
              ephemeral: true,
            });
            return;
          }

          await predictPoints(
            interaction,
            prediction2,
            args[1],
            new Number(args[2]),
            new Number(args[4])
          );
        }
        break;
      default:
        break;
    }
  } else if (interaction.isCommand() && commands[interaction.commandName])
    commands[interaction.commandName](interaction);
});

client.login(token);
