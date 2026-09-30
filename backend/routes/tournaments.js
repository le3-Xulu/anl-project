const express = require("express");
const Federation = require("../models/Federation");
const Match = require("../models/Match");
const Tournament = require("../models/Tournament");
const { simulateMatch } = require("../utils/matchEngine");
const { generateCommentary } = require("../utils/aiCommentary");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/tournaments/start — admin only
router.post("/start", protect, adminOnly, async (req, res) => {
  try {
    const federations = await Federation.find();

    if (federations.length < 8) {
      return res.status(400).json({
        message: `Need at least 8 federations. Currently: ${federations.length}.`,
      });
    }

    // Delete any previous tournament
    await Tournament.deleteMany({});
    await Match.deleteMany({});

    // Take 8 federations, shuffle them
    const teams = shuffle(federations).slice(0, 8);

    // Create the tournament
    const tournament = await Tournament.create({
      teams: teams.map((t) => t._id),
      status: "active",
      currentRound: "QF",
    });

    // Create 4 quarter-final matches
    const qfMatches = [];
    for (let i = 0; i < 4; i++) {
      const match = await Match.create({
        round: "QF",
        matchNumber: i + 1,
        teamA: teams[i * 2]._id,
        teamB: teams[i * 2 + 1]._id,
        tournamentId: tournament._id,
      });
      qfMatches.push(match._id);
    }

    tournament.matches = qfMatches;
    await tournament.save();

    res.status(201).json({
      message: "Tournament started",
      tournamentId: tournament._id,
      teams: teams.map((t) => ({ id: t._id, country: t.country, rating: t.countryRating })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/tournaments/current — public
router.get("/current", async (req, res) => {
  try {
    const tournament = await Tournament.findOne()
      .populate("teams", "country countryRating")
      .populate({
        path: "matches",
        populate: [
          { path: "teamA", select: "country countryRating" },
          { path: "teamB", select: "country countryRating" },
          { path: "winner", select: "country" },
        ],
      });

    if (!tournament) {
      return res.status(404).json({ message: "No active tournament." });
    }

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// POST /api/tournaments/match/:matchId/simulate — admin only, instant result
router.post("/match/:matchId/simulate", protect, adminOnly, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Match not found." });
    if (match.status === "completed") {
      return res.status(400).json({ message: "Match already completed." });
    }

    const teamA = await Federation.findById(match.teamA);
    const teamB = await Federation.findById(match.teamB);

    const result = simulateMatch(teamA, teamB);

    match.scoreA = result.scoreA;
    match.scoreB = result.scoreB;
    match.goals = result.goals;
    match.winner = result.winner;
    match.type = "simulated";
    match.status = "completed";
    await match.save();

    // If all QF matches are done, create the SF matches
    await maybeAdvanceRound(match.tournamentId);

    res.json({
      message: "Match simulated",
      match: {
        id: match._id,
        round: match.round,
        teamA: teamA.country,
        teamB: teamB.country,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        penaltyA: result.penaltyA,
        penaltyB: result.penaltyB,
        wentToExtraTime: result.wentToExtraTime,
        wentToPenalties: result.wentToPenalties,
        goals: match.goals,
        winner: result.winner,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/tournaments/match/:matchId/play — admin only, with AI commentary
router.post("/match/:matchId/play", protect, adminOnly, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ message: "Match not found." });
    if (match.status === "completed") {
      return res.status(400).json({ message: "Match already completed." });
    }

    const teamA = await Federation.findById(match.teamA);
    const teamB = await Federation.findById(match.teamB);

    const result = simulateMatch(teamA, teamB);
    const commentary = await generateCommentary(teamA, teamB, result);

    match.scoreA = result.scoreA;
    match.scoreB = result.scoreB;
    match.goals = result.goals;
    match.winner = result.winner;
    match.type = "played";
    match.status = "completed";
    match.commentary = commentary;
    await match.save();

    await maybeAdvanceRound(match.tournamentId);

    res.json({
      message: "Match played with commentary",
      match: {
        id: match._id,
        round: match.round,
        teamA: teamA.country,
        teamB: teamB.country,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        goals: match.goals,
        commentary: match.commentary,
        winner: result.winner,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// Helper: after a match completes, check if the round is done, then create next round
async function maybeAdvanceRound(tournamentId) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) return;

  // Check every round
  const rounds = ["QF", "SF", "F"];
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];

    const currentMatches = await Match.find({
      tournamentId,
      round: currentRound,
    });

    const allDone = currentMatches.every((m) => m.status === "completed");
    if (!allDone) continue;

    // Check if next round already exists
    const existingNext = await Match.find({ tournamentId, round: nextRound });
    if (existingNext.length > 0) continue;

    // Create next round matches by pairing winners in order
    const winners = currentMatches.map((m) => m.winner);
    const numNext = winners.length / 2;

    for (let j = 0; j < numNext; j++) {
      await Match.create({
        round: nextRound,
        matchNumber: j + 1,
        teamA: winners[j * 2],
        teamB: winners[j * 2 + 1],
        tournamentId,
      });
    }

    tournament.currentRound = nextRound;
    await tournament.save();
  }
}
// ============================================================
// POST /api/tournaments/restart — admin only
// Deletes all matches, wipes the bracket, and starts a fresh tournament
// with the same 8 federations (shuffled).
// ============================================================
router.post("/restart", protect, adminOnly, async (req, res) => {
  try {
    const federations = await Federation.find();

    if (federations.length < 8) {
      return res.status(400).json({
        message: `Need at least 8 federations. Currently: ${federations.length}.`,
      });
    }

    // Delete existing tournament and matches
    await Tournament.deleteMany({});
    await Match.deleteMany({});

    // Fresh shuffle
    const teams = shuffle(federations).slice(0, 8);

    const tournament = await Tournament.create({
      teams: teams.map((t) => t._id),
      status: "active",
      currentRound: "QF",
    });

    const qfIds = [];
    for (let i = 0; i < 4; i++) {
      const match = await Match.create({
        round: "QF",
        matchNumber: i + 1,
        teamA: teams[i * 2]._id,
        teamB: teams[i * 2 + 1]._id,
        tournamentId: tournament._id,
      });
      qfIds.push(match._id);
    }

    tournament.matches = qfIds;
    await tournament.save();

    res.json({
      message: "Tournament restarted",
      tournamentId: tournament._id,
      teams: teams.map((t) => ({
        id: t._id,
        country: t.country,
        rating: t.countryRating,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// GET /api/tournaments/scorers — public
// Returns the top goal scorers across the tournament.
// ============================================================
router.get("/scorers", async (req, res) => {
  try {
    const matches = await Match.find({ status: "completed" });

    const tally = {}; // playerName -> { goals, teamId }

    matches.forEach((m) => {
      m.goals.forEach((g) => {
        const key = g.playerName;
        if (!tally[key]) {
          tally[key] = { playerName: key, teamId: g.teamId, goals: 0 };
        }
        tally[key].goals += 1;
      });
    });

    // Attach country name
    const federations = await Federation.find().select("country");
    const fedMap = {};
    federations.forEach((f) => {
      fedMap[f._id.toString()] = f.country;
    });

    const list = Object.values(tally)
      .map((entry) => ({
        playerName: entry.playerName,
        country: fedMap[entry.teamId?.toString()] || "Unknown",
        goals: entry.goals,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// GET /api/tournaments/match/:matchId — public
// Returns a single match's details.
// If type === "played", commentary is included.
// If type === "simulated", only the score and goals are shown.
// ============================================================
router.get("/match/:matchId", async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("teamA", "country countryRating")
      .populate("teamB", "country countryRating")
      .populate("winner", "country");

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    const payload = {
      id: match._id,
      round: match.round,
      matchNumber: match.matchNumber,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      goals: match.goals,
      winner: match.winner,
      status: match.status,
      type: match.type,
    };

    if (match.type === "played") {
      payload.commentary = match.commentary;
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// ============================================================
// POST /api/tournaments/restart — admin only
// Deletes all matches, wipes the bracket, and starts a fresh tournament
// with the same 8 federations (shuffled).
// ============================================================
router.post("/restart", protect, adminOnly, async (req, res) => {
  try {
    const federations = await Federation.find();

    if (federations.length < 8) {
      return res.status(400).json({
        message: `Need at least 8 federations. Currently: ${federations.length}.`,
      });
    }

    // Delete existing tournament and matches
    await Tournament.deleteMany({});
    await Match.deleteMany({});

    // Fresh shuffle
    const teams = shuffle(federations).slice(0, 8);

    const tournament = await Tournament.create({
      teams: teams.map((t) => t._id),
      status: "active",
      currentRound: "QF",
    });

    const qfIds = [];
    for (let i = 0; i < 4; i++) {
      const match = await Match.create({
        round: "QF",
        matchNumber: i + 1,
        teamA: teams[i * 2]._id,
        teamB: teams[i * 2 + 1]._id,
        tournamentId: tournament._id,
      });
      qfIds.push(match._id);
    }

    tournament.matches = qfIds;
    await tournament.save();

    res.json({
      message: "Tournament restarted",
      tournamentId: tournament._id,
      teams: teams.map((t) => ({
        id: t._id,
        country: t.country,
        rating: t.countryRating,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// GET /api/tournaments/scorers — public
// Returns the top goal scorers across the tournament.
// ============================================================
router.get("/scorers", async (req, res) => {
  try {
    const matches = await Match.find({ status: "completed" });

    const tally = {}; // playerName -> { goals, teamId }

    matches.forEach((m) => {
      m.goals.forEach((g) => {
        const key = g.playerName;
        if (!tally[key]) {
          tally[key] = { playerName: key, teamId: g.teamId, goals: 0 };
        }
        tally[key].goals += 1;
      });
    });

    // Attach country name
    const federations = await Federation.find().select("country");
    const fedMap = {};
    federations.forEach((f) => {
      fedMap[f._id.toString()] = f.country;
    });

    const list = Object.values(tally)
      .map((entry) => ({
        playerName: entry.playerName,
        country: fedMap[entry.teamId?.toString()] || "Unknown",
        goals: entry.goals,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// GET /api/tournaments/match/:matchId — public
// Returns a single match's details.
// If type === "played", commentary is included.
// If type === "simulated", only the score and goals are shown.
// ============================================================
router.get("/match/:matchId", async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("teamA", "country countryRating")
      .populate("teamB", "country countryRating")
      .populate("winner", "country");

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    const payload = {
      id: match._id,
      round: match.round,
      matchNumber: match.matchNumber,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      goals: match.goals,
      winner: match.winner,
      status: match.status,
      type: match.type,
    };

    if (match.type === "played") {
      payload.commentary = match.commentary;
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// ============================================================
// POST /api/tournaments/restart — admin only
// Deletes all matches, wipes the bracket, and starts a fresh tournament
// with the same 8 federations (shuffled).
// ============================================================
router.post("/restart", protect, adminOnly, async (req, res) => {
  try {
    const federations = await Federation.find();

    if (federations.length < 8) {
      return res.status(400).json({
        message: `Need at least 8 federations. Currently: ${federations.length}.`,
      });
    }

    // Delete existing tournament and matches
    await Tournament.deleteMany({});
    await Match.deleteMany({});

    // Fresh shuffle
    const teams = shuffle(federations).slice(0, 8);

    const tournament = await Tournament.create({
      teams: teams.map((t) => t._id),
      status: "active",
      currentRound: "QF",
    });

    const qfIds = [];
    for (let i = 0; i < 4; i++) {
      const match = await Match.create({
        round: "QF",
        matchNumber: i + 1,
        teamA: teams[i * 2]._id,
        teamB: teams[i * 2 + 1]._id,
        tournamentId: tournament._id,
      });
      qfIds.push(match._id);
    }

    tournament.matches = qfIds;
    await tournament.save();

    res.json({
      message: "Tournament restarted",
      tournamentId: tournament._id,
      teams: teams.map((t) => ({
        id: t._id,
        country: t.country,
        rating: t.countryRating,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// GET /api/tournaments/scorers — public
// Returns the top goal scorers across the tournament.
// ============================================================
router.get("/scorers", async (req, res) => {
  try {
    const matches = await Match.find({ status: "completed" });

    const tally = {}; // playerName -> { goals, teamId }

    matches.forEach((m) => {
      m.goals.forEach((g) => {
        const key = g.playerName;
        if (!tally[key]) {
          tally[key] = { playerName: key, teamId: g.teamId, goals: 0 };
        }
        tally[key].goals += 1;
      });
    });

    // Attach country name
    const federations = await Federation.find().select("country");
    const fedMap = {};
    federations.forEach((f) => {
      fedMap[f._id.toString()] = f.country;
    });

    const list = Object.values(tally)
      .map((entry) => ({
        playerName: entry.playerName,
        country: fedMap[entry.teamId?.toString()] || "Unknown",
        goals: entry.goals,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================================
// GET /api/tournaments/match/:matchId — public
// Returns a single match's details.
// If type === "played", commentary is included.
// If type === "simulated", only the score and goals are shown.
// ============================================================
router.get("/match/:matchId", async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("teamA", "country countryRating")
      .populate("teamB", "country countryRating")
      .populate("winner", "country");

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    const payload = {
      id: match._id,
      round: match.round,
      matchNumber: match.matchNumber,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      goals: match.goals,
      winner: match.winner,
      status: match.status,
      type: match.type,
    };

    if (match.type === "played") {
      payload.commentary = match.commentary;
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;