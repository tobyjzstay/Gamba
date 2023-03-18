/**
 * Gamba Application.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

import { Client, CommandInteraction, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { User } from "./models/User";

export type Command = {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
};

// load environment variables
dotenv.config();

// load database
const users: User[] = [];
(async () => {
    console.log("Connecting to MongoDB...");
    // connect to mongodb
    const mongoClient = await mongoose
        .connect(process.env.MONGO_URI!)
        .then((client) => client.connection.getClient())
        .catch((error) => console.error(error));

    if (!mongoClient) return;
    console.log("Connected to MongoDB.");

    // initialise database
    // TODO:
})();

// initialise client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// load commands
const commands: Command[] = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

const commandPromises = Promise.all(
    commandFiles.map(async (file) => {
        const filePath = path.join(commandsPath, file);
        const { default: command } = (await import(filePath)) as { default: Command };
        if ("data" in command && "execute" in command) {
            commands.push(command);
        } else {
            console.error(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    })
);

// initialise REST module
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

// register commands
commandPromises.then(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = (await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), {
            body: commands.map((command) => command.data.toJSON()),
        })) as any[];

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
});

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find((command) => command.data.name === interaction.commandName);

    if (!command) {
        await interaction.reply({
            content: `No command matching **${interaction.commandName}** was found.`,
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while executing this command!",
                ephemeral: true,
            });
        } else {
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
});

// load data into memory

// (async () => {
//     try {
//         console.log("Reloading application commands...");

//         await rest.put(Routes.applicationCommands(clientId), {
//             body: schema,
//         });

//         console.log("Successfully reloaded application commands.");
//     } catch (error) {
//         console.error(error);
//     }
// })();

// async function getActivePredictions(guild) {
//     try {
//         const predictionsActiveData = await readData(guild, path.predictionsActive);
//         return predictionsActiveData;
//     } catch (err) {
//         console.error(err);
//         await initialiseGuild(guild);
//         return await getActivePredictions(guild);
//     }
// }

// client.on("ready", async () => {
//     client.user.setActivity("/predictions", { type: "LISTENING" });

//     client.guilds.cache.forEach(async (guild) => {
//         const predictionsActiveData = await getActivePredictions(guild);
//         for (let prediction in predictionsActiveData) {
//             await closePredictionTimer(guild, prediction);
//         }
//     });

//     setInterval(() => {
//         client.guilds.cache.forEach(async (guild) => {
//             await addAllPoints(guild, 10);
//         });
//     }, 60 * 1000 * 5); // runs every 5 minutes
// });

// client.on("guildCreate", async (guild) => {
//     initialiseGuild(guild);
// });

// client.on("interactionCreate", async (interaction) => {
//     // TODO: check in a valid guild?
//     if (interaction.user.bot || !interaction.channel) return;

//     if (interaction.isButton()) {
//         const args = interaction.customId.split("_");
//         switch (args.length) {
//             case 3:
//                 const points = await getPoints(interaction.guild, interaction.user.id);
//                 const prediction = await getPrediction(interaction.guild, args[1]);

//                 if (!prediction || prediction.uuid !== args[0]) {
//                     interaction.reply({
//                         content:
//                             (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/predictions\` to list all the active predictions.`),
//                         ephemeral: true,
//                     });
//                     return;
//                 }

//                 if (isNaN(args[2])) {
//                     switch (args[2]) {
//                         case "end":
//                             const row = new MessageActionRow().addComponents(
//                                 new MessageButton()
//                                     .setCustomId(`${prediction.uuid}_${args[1]}_end_1`)
//                                     .setLabel(`Prediction "${prediction.outcomes[0].option}"`)
//                                     .setStyle("PRIMARY"),
//                                 new MessageButton()
//                                     .setCustomId(`${prediction.uuid}_${args[1]}_end_2`)
//                                     .setLabel(`Prediction "${prediction.outcomes[1].option}"`)
//                                     .setStyle("SECONDARY")
//                             );

//                             await interaction.reply({
//                                 content: `Ending prediction **#${args[1]}**. Select the prediction outcome below or use \`/end ${args[1]} <index>\`.`,
//                                 ephemeral: true,
//                                 components: [row],
//                             });
//                             break;
//                         case "close":
//                             await setClosedPrediction(interaction, args[1]);
//                             break;
//                         case "delete":
//                             const row2 = new MessageActionRow().addComponents(
//                                 new MessageButton()
//                                     .setCustomId(`${prediction.uuid}_${args[1]}_cancel_1`)
//                                     .setLabel(`Delete "${prediction.name}"`)
//                                     .setStyle("DANGER")
//                             );

//                             await interaction.reply({
//                                 content: `Are you sure you want to delete prediction **#${args[1]}**? All points will be refunded.`,
//                                 ephemeral: true,
//                                 components: [row2],
//                             });
//                             break;
//                         default:
//                             break;
//                     }
//                     break;
//                 } else {
//                     const row = new MessageActionRow();
//                     const allocation = [5, 10, 25, 50, 100];
//                     const pointsAllocation = [];

//                     for (let i in allocation) {
//                         pointsAllocation.push(Math.round(points * (allocation[i] / 100)));
//                         if (i < allocation.length - 1) {
//                             row.addComponents(
//                                 new MessageButton()
//                                     .setDisabled(pointsAllocation[i] ? false : true)
//                                     .setCustomId(`${interaction.customId}_${allocation[i]}_${pointsAllocation[i]}`)
//                                     .setLabel(`Predict ${allocation[i]}% (${formatNumber(pointsAllocation[i])})`)
//                                     .setStyle(args[2] % 2 ? "PRIMARY" : "SECONDARY")
//                             );
//                         } else {
//                             row.addComponents(
//                                 new MessageButton()
//                                     .setDisabled(pointsAllocation[i] ? false : true)
//                                     .setCustomId(`${interaction.customId}_allIn_${pointsAllocation[i]}`)
//                                     .setLabel(`ALL IN`)
//                                     .setStyle("DANGER")
//                             );
//                         }
//                     }

//                     await interaction.reply({
//                         content: `Predicting **#${args[1]}** "${prediction.outcomes[args[2] - 1].option}" (**${
//                             args[2]
//                         }**). You have **${formatNumber(points)}** point${
//                             points === 1 ? "" : "s"
//                         }. Select a percentage of points below or use \`/predict ${args[1]} ${args[2]} <amount>\`.`,
//                         ephemeral: true,
//                         components: [row],
//                     });
//                 }
//                 break;
//             case 4:
//                 const prediction22 = await getPrediction(interaction.guild, args[1]);

//                 if (!prediction22 || prediction22.uuid !== args[0]) {
//                     await interaction.reply({
//                         content:
//                             (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/predictions\` to list all the active predictions.`),
//                         ephemeral: true,
//                     });
//                     return;
//                 }

//                 switch (args[2]) {
//                     case "end":
//                         await endPrediction(interaction, args[1], args[3], false);
//                         break;
//                     case "delete":
//                         await cancelPrediction(interaction, args[1], false);
//                         break;
//                     default:
//                         break;
//                 }
//                 break;
//             case 5:
//                 if (isNaN(args[3])) {
//                     switch (args[3]) {
//                         case "allIn":
//                             const prediction3 = await getPrediction(interaction.guild, args[1]);

//                             if (!prediction3 || prediction3.uuid !== args[0]) {
//                                 await interaction.reply({
//                                     content:
//                                         (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/predictions\` to list all the active predictions.`),
//                                     ephemeral: true,
//                                 });
//                                 return;
//                             }
//                             const row3 = new MessageActionRow().addComponents(
//                                 new MessageButton()
//                                     .setCustomId(`${prediction3.uuid}_${args[1]}_${args[2]}_100_${args[4]}`)
//                                     .setLabel(`Predict 100% (${formatNumber(args[4])})`)
//                                     .setStyle("DANGER")
//                             );

//                             await interaction.reply({
//                                 content: `Predicting **#${args[1]}** "${prediction3.outcomes[args[2] - 1].option}" (**${
//                                     args[2]
//                                 }**). Are you sure you want to go **ALL IN**?`,
//                                 ephemeral: true,
//                                 components: [row3],
//                             });
//                             break;
//                         default:
//                             break;
//                     }
//                 } else {
//                     const prediction2 = await getPrediction(interaction.guild, args[1]);

//                     if (!prediction2 || prediction2.uuid !== args[0]) {
//                         await interaction.reply({
//                             content:
//                                 (message = `The prediction **#${args[1]}** (${args[0]}) no longer exists. Use \`/predictions\` to list all the active predictions.`),
//                             ephemeral: true,
//                         });
//                         return;
//                     }

//                     await predictPoints(interaction, prediction2, args[1], new Number(args[2]), new Number(args[4]));
//                 }
//                 break;
//             case 6:
//                 if (args[0] === "create") {
//                     await createPrediction(
//                         interaction,
//                         args[1], // uuid
//                         args[2], // name
//                         args[3], // option1
//                         args[4], // option2
//                         Math.floor((args[5] / (1000 * 60)) % 60), // minutes
//                         Math.floor((args[5] / (1000 * 60 * 60)) % 24), // hours
//                         Math.floor(args[5] / (1000 * 60 * 60) / 24) // days
//                     );
//                 }
//                 break;
//             default:
//                 break;
//         }
//     } else if (interaction.isCommand() && commands[interaction.commandName])
//         commands[interaction.commandName](interaction);
// });
