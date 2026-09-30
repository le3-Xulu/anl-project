const express = require("express");
const Federation = require("../models/Federation");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Helper: generate a random integer between min and max (inclusive)
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: build a player's ratings based on their natural position
function generateRatings(naturalPosition) {
  const positions = ["GK", "DF", "MD", "AT"];
  const ratings = {};
  positions.forEach((pos) => {
    ratings[pos] = pos === naturalPosition ? rand(50, 100) : rand(0, 50);
  });
  return ratings;
}

// Helper: generate 23 fake players with a mix of positions
function generateSquad() {
  const firstNames = ["Kofi", "Yaw", "Kwame", "Amara", "Chidi", "Sadio", "Riyad", "Mohamed", "Victor", "Samuel", "Joel", "Thomas", "Jordan", "Andre", "Eric", "Emmanuel", "Daniel", "Peter", "Paul", "John", "David", "Simon", "Isaac"];
  const lastNames = ["Mensah", "Osei", "Boateng", "Diallo", "Traore", "Kone", "Salah", "Mane", "Mahrez", "Aubameyang", "Osimhen", "Eto'o", "Drogba", "Yaya", "Kessie", "Zaha", "Kudus", "Sarr", "Bennacer", "Hakimi"];

  // Position distribution: 3 GK, 7 DF, 7 MD, 6 AT = 23
  const positionPlan = [
    ...Array(3).fill("GK"),
    ...Array(7).fill("DF"),
    ...Array(7).fill("MD"),
    ...Array(6).fill("AT"),
  ];

  const players = [];
  for (let i = 0; i < 23; i++) {
    const naturalPosition = positionPlan[i];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    players.push({
      name,
      naturalPosition,
      isCaptain: false,
      ratings: generateRatings(naturalPosition),
    });
  }

  // Mark one random outfield player as captain
  players[Math.floor(Math.random() * 23)].isCaptain = true;
  return players;
}

// POST /api/federations/register
// Protected — must be logged in
router.post("/register", protect, async (req, res) => {
  try {
    const { country, manager, players } = req.body;

    if (!country || !manager) {
      return res.status(400).json({ message: "Country and manager are required." });
    }

    // Check if country already registered
    const existing = await Federation.findOne({ country });
    if (existing) {
      return res.status(400).json({ message: "That country is already registered." });
    }

    // Check if this user already has a federation
    const userHasFed = await Federation.findOne({ representativeId: req.user.id });
    if (userHasFed) {
      return res.status(400).json({ message: "You have already registered a federation." });
    }

    // Use provided players OR auto-generate a squad
    const squad = players && players.length === 23 ? players : generateSquad();

    // Ensure each player has ratings (if provided manually, generate them)
    squad.forEach((p) => {
      if (!p.ratings) {
        p.ratings = generateRatings(p.naturalPosition);
      }
    });

    // Compute country rating = average of each player's rating at their natural position
    const total = squad.reduce((sum, p) => sum + p.ratings[p.naturalPosition], 0);
    const countryRating = Math.round((total / squad.length) * 100) / 100;

    const federation = await Federation.create({
      country,
      manager,
      representativeId: req.user.id,
      players: squad,
      countryRating,
    });

    // Link the federation to the user
    await User.findByIdAndUpdate(req.user.id, { federationId: federation._id });

    res.status(201).json({
      message: "Federation registered successfully",
      federation: {
        id: federation._id,
        country: federation.country,
        manager: federation.manager,
        countryRating: federation.countryRating,
        playerCount: federation.players.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/federations — public list of all federations
router.get("/", async (req, res) => {
  try {
    const feds = await Federation.find().select("country manager countryRating");
    res.json(feds);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;