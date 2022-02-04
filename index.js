/**
 * Gamba
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.login(token);
