/**
 * Gamba Application.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

import {
    Client,
    CommandInteraction,
    Events,
    GatewayIntentBits,
    Guild,
    REST,
    Routes,
    SlashCommandBuilder
} from "discord.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

export type Command = {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
};

// load environment variables
dotenv.config();

// load database
let db: mongoose.mongo.Db;
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
    db = mongoClient.db(process.env.ENVRIONMENT);

    // close expired predictions
    // db.collection("guilds")
    //     .find({ predictions: { closed: false } })
    //     .forEach((guild) => {
    //         guild.predictions
    //             .filter((prediction) => !prediction.closed && prediction.end.getTime() < Date.now())
    //             .forEach(closePrediction);
    //     });
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

// initialise commands
commandPromises.then(async () => {
    try {
        // delete all commands
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: [] });
        console.log("Successfully deleted all application commands.");

        // register commands
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = (await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
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

    if (!db) {
        console.warn("Database not initialised.");
        return;
    }
    c.guilds.cache.forEach(updateGuild);

    // update users in database?
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

async function updateGuild(guild: Guild) {
    try {
        const guildData = db.collection("guilds");
        guildData.findOneAndUpdate({ id: guild.id }, { $set: { id: guild.id } }, { upsert: true });
        (await guild.members.fetch()).forEach((member) => {
            guildData.findOneAndUpdate(
                { id: guild.id, "users.id": member.user.id },
                { $set: { id: guild.id, "users.id": member.user.id } },
                { upsert: true }
            );
        });
    } catch (error) {
        console.error(error);
    }
}

// async function addAllPoints(guild: Guild) {
//     try {
//         const pointsData = await readData(guild, path.points);
//         let updatedPointsData = {};

//         await guild.members.fetch(); // cache update
//         guild.roles.everyone.members.forEach((member) => {
//             // don't add points to bots
//             if (member.user.bot) updatedPointsData[member.user.id] = 0;
//             else updatedPointsData[member.user.id] = pointsData[member.user.id] + increment;
//         });

//         fs.writeFileSync(`${path.points}${guild.id}.json`, JSON.stringify(updatedPointsData, null, 2), "utf-8");
//     } catch (err) {
//         console.error(err);
//         await initialiseGuild(guild);
//         return await addAllPoints(guild, increment);
//     }
// }
