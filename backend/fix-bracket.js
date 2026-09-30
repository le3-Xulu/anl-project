require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const Match = require("./models/Match");
const Tournament = require("./models/Tournament");

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const tournament = await Tournament.findOne();
  if (!tournament) {
    console.log("No tournament found");
    process.exit(0);
  }

  const qfs = await Match.find({ tournamentId: tournament._id, round: "QF" }).sort("matchNumber");
  console.log("QFs:");
  qfs.forEach((m) => console.log(`  ${m.matchNumber}: winner = ${m.winner}`));

  const existingSFs = await Match.find({ tournamentId: tournament._id, round: "SF" });
  if (existingSFs.length > 0) {
    console.log("SFs already exist. Nothing to do.");
    process.exit(0);
  }

  if (qfs.length !== 4 || qfs.some((m) => !m.winner)) {
    console.log("Not all QFs have a winner yet.");
    process.exit(0);
  }

  const winners = qfs.map((m) => m.winner);
  const sf1 = await Match.create({
    round: "SF",
    matchNumber: 1,
    teamA: winners[0],
    teamB: winners[1],
    tournamentId: tournament._id,
  });
  const sf2 = await Match.create({
    round: "SF",
    matchNumber: 2,
    teamA: winners[2],
    teamB: winners[3],
    tournamentId: tournament._id,
  });

  tournament.matches.push(sf1._id, sf2._id);
  tournament.currentRound = "SF";
  await tournament.save();

  console.log("SF matches created:", sf1._id, sf2._id);
  process.exit(0);
}

fix().catch((e) => {
  console.error(e);
  process.exit(1);
});