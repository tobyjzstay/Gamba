/**
 * Helper commands used across commands.
 *
 * @author Toby Stayner <toby@swengineer.dev>
 */

const fs = require("fs");
module.exports = { readData, initialiseGuild, addAllPoints };

async function readData(guild, path) {
  return await JSON.parse(
    fs.readFileSync(`${path}${guild.id}.json`, "utf-8", (err) => {
      console.error(err);
    })
  );
}

async function initialiseGuild(guild) {
  if (!fs.existsSync(`${path.points}${guild.id}.json`)) {
    let pointsData = {};
    await guild.members
      .fetch()
      .then((members) =>
        members.forEach((member) => (pointsData[member.user.id] = 0))
      );

    fs.writeFileSync(
      `${path.points}${guild.id}.json`,
      JSON.stringify(pointsData, null, 2),
      "utf-8"
    );
  }
  if (!fs.existsSync(`${path.predictionsActive}${guild.id}.json`)) {
    fs.writeFileSync(
      `${path.predictionsActive}${guild.id}.json`,
      "{}",
      "utf-8"
    );
  }
  if (!fs.existsSync(`${path.predictionsArchive}${guild.id}.json`)) {
    fs.writeFileSync(
      `${path.predictionsArchive}${guild.id}.json`,
      "{}",
      "utf-8"
    );
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
      else
        updatedPointsData[member.user.id] =
          pointsData[member.user.id] + increment;
    });

    fs.writeFileSync(
      `${path.points}${guild.id}.json`,
      JSON.stringify(updatedPointsData, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error(err);
    await initialiseGuild(guild);
    return addAllPoints(guild, increment);
  }
}
