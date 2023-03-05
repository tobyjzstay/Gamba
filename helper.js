/**
 * Helper commands used across commands.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");
const { path } = require("./config.json");

module.exports = {
    readData,
    initialiseGuild,
    getPoints,
    addAllPoints,
    getPrediction,
    showPrediction,
    setAllPoints,
    archivePrediction,
    predictPoints,
    setClosedPrediction,
    endPrediction,
    cancelPrediction,
    createPrediction,
    closePredictionTimer,
    formatNumber,
};

async function readData(guild, path) {
    return await JSON.parse(
        fs.readFileSync(`${path}${guild.id}.json`, "utf-8", (err) => {
            console.error(err);
        })
    );
}

async function initialiseGuild(guild) {
    fs.mkdirSync(path.points, { recursive: true });
    if (!fs.existsSync(`${path.points}${guild.id}.json`)) {
        let pointsData = {};
        await guild.members.fetch().then((members) => members.forEach((member) => (pointsData[member.user.id] = 0)));

        fs.writeFileSync(`${path.points}${guild.id}.json`, JSON.stringify(pointsData, null, 2), "utf-8");
    }
    fs.mkdirSync(path.predictionsActive, { recursive: true });
    if (!fs.existsSync(`${path.predictionsActive}${guild.id}.json`)) {
        fs.writeFileSync(`${path.predictionsActive}${guild.id}.json`, "{}", "utf-8");
    }
    fs.mkdirSync(path.predictionsArchive, { recursive: true });
    if (!fs.existsSync(`${path.predictionsArchive}${guild.id}.json`)) {
        fs.writeFileSync(`${path.predictionsArchive}${guild.id}.json`, "[]", "utf-8");
    }
}

async function getPoints(guild, userId) {
    try {
        const pointsData = await readData(guild, path.points);
        return pointsData[userId];
    } catch (err) {
        console.error(err);
        await initialiseGuild(guild);
        return await getPoints(guild, userId);
    }
}

async function addAllPoints(guild, increment) {
    try {
        const pointsData = await readData(guild, path.points);
        let updatedPointsData = {};

        await guild.members.fetch(); // cache update
        guild.roles.everyone.members.forEach((member) => {
            // don't add points to bots
            if (member.user.bot) updatedPointsData[member.user.id] = 0;
            else updatedPointsData[member.user.id] = pointsData[member.user.id] + increment;
        });

        fs.writeFileSync(`${path.points}${guild.id}.json`, JSON.stringify(updatedPointsData, null, 2), "utf-8");
    } catch (err) {
        console.error(err);
        await initialiseGuild(guild);
        return await addAllPoints(guild, increment);
    }
}

async function getPrediction(guild, id) {
    try {
        const predictionsActiveData = await readData(guild, path.predictionsActive);
        return predictionsActiveData[id] ? predictionsActiveData[id] : matchUUID();

        function matchUUID() {
            let found;
            for (let prediction in predictionsActiveData) {
                if (predictionsActiveData[prediction].uuid === id) found = prediction;
            }
            return found;
        }
    } catch (err) {
        console.error(err);
        await initialiseGuild(guild);
        return await getPrediction(guild, id);
    }
}

async function showPrediction(interaction, id, reply) {
    let message;
    let timeLeft;
    let timer;

    const intervalId = async function () {
        const prediction = await getPrediction(interaction.guild, id);
        const option1Image = new MessageAttachment("./images/blue1.png");
        const option2Image = new MessageAttachment("./images/pink2.png");
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setDisabled(!prediction || prediction.closed)
                .setCustomId(`${prediction.uuid}_${id}_1`)
                .setLabel(`Predict "${prediction.options[0].option}"`)
                .setStyle("PRIMARY"),
            new MessageButton()
                .setDisabled(!prediction || prediction.closed)
                .setCustomId(`${prediction.uuid}_${id}_2`)
                .setLabel(`Predict "${prediction.options[1].option}"`)
                .setStyle("SECONDARY"),
            new MessageButton()
                .setDisabled(!prediction)
                .setCustomId(`${prediction.uuid}_${id}_${prediction.closed ? "end" : "close"}`)
                .setLabel(prediction.closed ? "End" : "Close")
                .setStyle("SUCCESS"),
            new MessageButton().setDisabled(!prediction).setCustomId(`${prediction.uuid}_${id}_cancel`).setLabel("Cancel").setStyle("DANGER")
        );

        const closes = new Date(prediction.closes);

        function msToTime(duration) {
            let seconds = Math.floor((duration / 1000) % 60),
                minutes = Math.floor((duration / (1000 * 60)) % 60),
                hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
                days = Math.floor(duration / (1000 * 60 * 60) / 24);

            let output = "";
            if (days) output += `${days} day${days === 1 ? "" : "s"}`;
            else if (hours) output += `${output ? " " : ""}${hours} hour${hours === 1 ? "" : "s"}`;
            else if (minutes) output += `${output ? " " : ""}${minutes} minute${minutes === 1 ? "" : "s"}`;
            else if (seconds) output += `${output ? " " : ""}${seconds} second${seconds === 1 ? "" : "s"}`;
            return output;
        }

        const member = await interaction.guild.members.fetch(prediction.author);
        timeLeft = new Date(closes) - new Date();

        let seconds = Math.floor((timeLeft / 1000) % 60),
            minutes = Math.floor((timeLeft / (1000 * 60)) % 60),
            hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24),
            days = Math.floor(timeLeft / (1000 * 60 * 60) / 24);

        if (days > 0) timer = 1000 * 60 * 60 * 24;
        else if (hours > 0) timer = 1000 * 60 * 60;
        else if (minutes > 0) timer = 1000 * 60;
        else if (seconds > 0) timer = 1000;

        const time = msToTime(timeLeft);
        const embedTitle = new MessageEmbed()
            .setColor("#404040")
            .setTitle(`#${id}: ${prediction.name}`)
            .setDescription(!prediction ? "Prediction cancelled" : prediction.closed ? "Prediction closed" : timeLeft <= 0 || !time ? "Prediction closing..." : `Prediction closes in ${time}`)
            .setAuthor({
                name: `${member.user.tag}`,
                iconURL: `${member.user.displayAvatarURL()}`,
            })
            .setFooter({
                text: `${prediction.uuid}`,
            });

        const voters1 = prediction.options[0].voters;
        const totalPoints1 = Object.entries(voters1).reduce((p, i) => p + i[1], 0);

        const topVoters1 = Object.entries(voters1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1);

        const topVoter1 = topVoters1[0] ? await interaction.guild.members.fetch(topVoters1[0][0]) : null;

        const voters2 = prediction.options[1].voters;
        const totalPoints2 = Object.entries(voters2).reduce((p, i) => p + i[1], 0);

        const topVoters2 = Object.entries(voters2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1);

        const topVoter2 = topVoters2[0] ? await interaction.guild.members.fetch(topVoters2[0][0]) : null;

        const totalVoters1 = Object.keys(voters1).length;
        const totalVoters2 = Object.keys(voters2).length;
        const embed1 = new MessageEmbed()
            .setColor("#387aff")
            .setTitle(`${prediction.options[0].option}${totalVoters1 + totalVoters2 ? ` (${Math.round((totalPoints1 / (totalPoints1 + totalPoints2)) * 100)}%)` : ``}`)
            .setThumbnail("attachment://blue1.png")
            .addFields(
                {
                    name: "\u200b",
                    value: `:yellow_circle: **Total Points:** ${formatNumber(totalPoints1)}
            :trophy: **Return Ratio:** 1:${totalPoints2 / totalPoints1 < 1 ? Math.round((totalPoints2 / totalPoints1 + 1) * 100) / 100 : Math.round((totalPoints2 / totalPoints1) * 100) / 100}
            :family_man_girl: **Total Voters:** ${Object.keys(prediction.options[0].voters).length}
            :medal: ${topVoter1 ? `${topVoter1}: ${formatNumber(topVoters1[0][1])}` : "-"}`,
                    inline: true,
                },
                {
                    name: "\u200b",
                    value: "\u200b",
                    inline: true,
                }
            );
        const embed2 = new MessageEmbed()
            .setColor("#f5009b")
            .setTitle(`${prediction.options[1].option}${totalVoters1 + totalVoters2 ? ` (${Math.round((totalPoints2 / (totalPoints1 + totalPoints2)) * 100)}%)` : ``}`)
            .setThumbnail("attachment://pink2.png")
            .addFields(
                {
                    name: "\u200b",
                    value: `:yellow_circle: **Total Points:** ${formatNumber(totalPoints2)}
            :trophy: **Return Ratio:** 1:${totalPoints1 / totalPoints2 < 1 ? Math.round((totalPoints1 / totalPoints2 + 1) * 100) / 100 : Math.round((totalPoints1 / totalPoints2) * 100) / 100}
            :family_man_girl: **Total Voters:** ${Object.keys(prediction.options[1].voters).length}
            :medal: ${topVoter2 ? `${topVoter2}: ${formatNumber(topVoters2[0][1])}` : "-"}`,
                    inline: true,
                },
                {
                    name: "\u200b",
                    value: "\u200b",
                    inline: true,
                }
            );

        if (!message) {
            if (reply) await interaction.reply({ content: `Displaying prediction **#${id}**.`, ephemeral: true });
            const channel = await interaction.member.guild.channels.cache.get(interaction.channelId);
            message = await channel.send({
                allowedMentions: { users: [] },
                fetchReply: true,
                embeds: [embedTitle, embed1, embed2],
                files: [option1Image, option2Image],
                components: [row],
            });
        } else {
            await message.edit({
                allowedMentions: { users: [] },
                fetchReply: true,
                embeds: [embedTitle, embed1, embed2],
                components: [row],
            });
        }

        if (!prediction.closed) setTimeout(intervalId, timer);
    };
    setTimeout(intervalId, timer);
}

async function setAllPoints(guild, voters) {
    if (!voters) return;
    const pointsData = await readData(guild, path.points);
    let updatedPointsData = pointsData;
    for (let voter in voters) {
        updatedPointsData[voter] += voters[voter];
    }
    fs.writeFileSync(`${path.points}${guild.id}.json`, JSON.stringify(updatedPointsData, null, 2), "utf-8");
}

async function archivePrediction(guild, id) {
    try {
        const prediction = await getPrediction(guild, id);
        const predictionsArchiveData = await readData(guild, path.predictionsArchive);
        let updatedPredictionsArchiveData = predictionsArchiveData;
        updatedPredictionsArchiveData.push(prediction);

        fs.writeFileSync(`${path.predictionsArchive}${guild.id}.json`, JSON.stringify(updatedPredictionsArchiveData, null, 2), "utf-8");

        const predictionsActiveData = await readData(guild, path.predictionsActive);
        let updatedPredictionsActiveData = predictionsActiveData;
        delete updatedPredictionsActiveData[id];
        fs.writeFileSync(`${path.predictionsActive}${guild.id}.json`, JSON.stringify(updatedPredictionsActiveData, null, 2), "utf-8");
    } catch (err) {
        console.error(err);
        await initialiseGuild(guild);
        return await archivePrediction(guild, id);
    }
}

async function predictPoints(interaction, prediction, id, index, amount) {
    const points = await getPoints(interaction.guild, interaction.user.id);
    let message;
    if (!prediction) {
        message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
    } else if (index <= 0 || index > prediction.options.length) {
        message = `Invalid input for **index**. Enter an integer between **1** and **${prediction.options.length}**.`;
    } else if (amount <= 0 || amount > points) {
        message = `Invalid input for **amount**. You have **${formatNumber(points)}** point${points === 1 ? "" : "s"}.`;
    } else if (prediction.closed) {
        message = `The prediction **#${id}** is closed.`;
    } else {
        for (let option in prediction.options) {
            const name = prediction.options[option].option;
            const voters = prediction.options[option].voters;
            const opt = new Number(option) + 1;
            if (voters[interaction.user.id] && opt != index) {
                message = `You have already predicted "${name}" (**${opt}**) for **${formatNumber(voters[interaction.user.id])}** point${amount === 1 ? "" : "s"}.`;
                break;
            }
        }
    }

    if (message) {
        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    // calculate new user prediction
    let predicted = new Number(prediction.options[index - 1].voters[interaction.user.id]);
    if (isNaN(predicted)) predicted = 0;
    predicted += amount;

    // deduct points from user
    await setPoints(interaction.guild, interaction.user.id, points - amount);

    // update user prediction
    await setUserPrediction(interaction.guild, interaction.user.id, id, index - 1, predicted);

    await interaction.reply({
        allowedMentions: { users: [] },
        content: `${interaction.user} has predicted **#${id}** "${prediction.options[index - 1].option}" (**${index}**) for **${formatNumber(amount)}** point${amount === 1 ? "" : "s"} (**${formatNumber(predicted)}** point${predicted === 1 ? "" : "s"} total).`,
    });
}

async function setPoints(guild, userId, points) {
    const pointsData = await readData(guild, path.points);
    let updatedPointsData = pointsData;
    updatedPointsData[userId] = points;
    fs.writeFileSync(`${path.points}${guild.id}.json`, JSON.stringify(updatedPointsData, null, 2), "utf-8");
}

async function setUserPrediction(guild, userId, id, index, amount) {
    const predictionsActiveData = await readData(guild, path.predictionsActive);
    let updatedPredictionsActiveData = predictionsActiveData;
    updatedPredictionsActiveData[id].options[index].voters[userId] = amount;
    fs.writeFileSync(`${path.predictionsActive}${guild.id}.json`, JSON.stringify(updatedPredictionsActiveData, null, 2), "utf-8");
}

async function setClosedPrediction(interaction, id) {
    const prediction = await getPrediction(interaction.guild, id);
    const author = await interaction.guild.members.fetch(prediction.author);

    let message;
    if (!prediction) {
        message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
    } else if (prediction.author !== interaction.user && !interaction.member.permissions.has("ADMINISTRATOR")) {
        message = `You do not have permission. Only ${author} and server administrators can close the prediction **#${id}**.`;
    } else if (prediction.closed) {
        message = `The prediction **#${id}** is already closed.`;
    }

    if (message) {
        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    await closePrediction(interaction.guild, id);

    await interaction.reply({
        allowedMentions: { users: [] },
        content: `${interaction.user} closed the prediction **#${id}**.`,
        ephemeral: true,
    });
}

async function closePrediction(guild, id) {
    try {
        const predictionsActiveData = await readData(guild, path.predictionsActive);
        let updatedPredictionsActiveData = predictionsActiveData;
        updatedPredictionsActiveData[id].closed = true;
        fs.writeFileSync(`${path.predictionsActive}${guild.id}.json`, JSON.stringify(updatedPredictionsActiveData, null, 2), "utf-8");
    } catch (err) {
        console.error(err);
        await initialiseGuild(guild);
        return await closePrediction(guild, id);
    }
}

async function endPrediction(interaction, id, index, reply) {
    const prediction = await getPrediction(interaction.guild, id);

    let message;
    if (!prediction) {
        message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
    } else if (prediction.author !== interaction.user && !interaction.member.permissions.has("ADMINISTRATOR")) {
        message = `You do not have permission. Only ${author} and server administrators can close the prediction **#${id}**.`;
    } else if (!prediction.closed) {
        message = `The prediction **#${id}** needs to be closed first before ending. Use \`/close\` to close the prediction.`;
    } else if (index <= 0 || index > prediction.options.length) {
        message = `Invalid input for **index**. Enter an integer between **1** and **${prediction.options.length}**.`;
    }

    if (message) {
        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    const winnerVoters = prediction.options[index - 1].voters;
    const totalPointsWon = Object.entries(winnerVoters).reduce((p, i) => p + i[1], 0);
    let totalPointsLost = 0;
    for (let i = 0; i < prediction.options.length; i++) {
        if (i + 1 !== index) totalPointsLost += Object.entries(prediction.options[i].voters).reduce((p, i) => p + i[1], 0);
    }

    let ratio = totalPointsLost / totalPointsWon;

    for (let winnerVoter in winnerVoters) {
        winnerVoters[winnerVoter] = Math.round(winnerVoters[winnerVoter] * ratio);
    }

    // update the points
    await setAllPoints(interaction.guild, winnerVoters);

    // archive the prediction
    await archivePrediction(interaction.guild, id);

    const data = {
        allowedMentions: { users: [] },
        content: `${interaction.user} ended the prediction **#${id}**. The outcome was "${prediction.options[index - 1].option}" (**${index}**).`,
    };
    if (reply) await interaction.reply(data);
    else {
        const channel = await interaction.member.guild.channels.cache.get(interaction.channelId);
        await channel.send(data);
        await interaction.deferUpdate();
    }
    return;
}

async function cancelPrediction(interaction, id, reply) {
    const prediction = await getPrediction(interaction.guild, id);

    let message;
    if (!prediction) {
        message = `Invalid input for **id**. The prediction **#${id}** could not be found. Use \`/gamba\` to list all the active predictions.`;
    } else if (prediction.author !== interaction.user && !interaction.member.permissions.has("ADMINISTRATOR")) {
        message = `You do not have permission. Only ${author} and server administrators can cancel the prediction **#${id}**.`;
    }

    if (message) {
        await interaction.reply({
            content: message,
            ephemeral: true,
        });
        return;
    }

    const refundVoters = {};
    for (let i = 0; i < prediction.options.length; i++) {
        const voters = prediction.options[i].voters;
        for (let voter in voters) {
            refundVoters[voter] = voters[voter];
        }
    }

    // update the points
    await setAllPoints(interaction.guild, refundVoters);

    // archive the prediction
    await archivePrediction(interaction.guild, id);

    const data = {
        allowedMentions: { users: [] },
        content: `${interaction.user} cancelled the prediction **#${id}**.`,
    };
    if (reply) await interaction.reply(data);
    else {
        const channel = await interaction.member.guild.channels.cache.get(interaction.channelId);
        await channel.send(data);
    }
    return;
}

async function createPrediction(
    interaction,
    uuid,
    name,
    option1,
    option2,
    minutes, // TODO pass in total milliseconds instead
    hours,
    days
) {
    const prediction = await getPrediction(interaction.guild, uuid);

    if (prediction) {
        await interaction.reply({
            content: (message = `The prediction "${name}" has already been created. Use \`/gamba\` to list all the active predictions.`),
            ephemeral: true,
        });
        return;
    }

    const created = new Date();
    const closes = new Date(created);
    closes.setMinutes(closes.getMinutes() + minutes);
    closes.setHours(closes.getHours() + hours);
    closes.setDate(closes.getDate() + days);

    const newPrediction = {
        uuid: uuid,
        name: name,
        author: interaction.user.id,
        created: created,
        closes: closes,
        closed: false,
        options: [
            {
                option: option1,
                voters: {},
            },
            {
                option: option2,
                voters: {},
            },
        ],
    };
    await addPrediction(interaction, newPrediction);
    await interaction.deferUpdate();
}

async function addPrediction(interaction, prediction) {
    try {
        const predictionsActiveData = await readData(interaction.guild, path.predictionsActive);

        let updatedPredictionsActiveData = predictionsActiveData;
        let id;
        for (let i = 1; true; i++) {
            if (!updatedPredictionsActiveData[i]) {
                id = i;
                updatedPredictionsActiveData[id] = prediction;
                break;
            }
        }

        fs.writeFileSync(`${path.predictionsActive}${interaction.guild.id}.json`, JSON.stringify(updatedPredictionsActiveData, null, 2), "utf-8");

        await showPrediction(interaction, id, false);
        await closePredictionTimer(interaction.guild, id);
    } catch (err) {
        console.error(err);
        await initialiseGuild(interaction.guild);
        return await addPrediction(interaction, prediction);
    }
}

async function closePredictionTimer(guild, id) {
    const prediction = await getPrediction(guild, id);
    const uuid = prediction.uuid;
    const timeLeft = new Date(prediction.closes) - new Date();
    setTimeout(
        async () => {
            const prediction = await getPrediction(guild, uuid);
            if (prediction && !prediction.closed) {
                await closePrediction(guild, id);
            }
        },
        timeLeft > 0 ? timeLeft : 0
    );
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
