const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Federation = require("../models/Federation");

const router = express.Router();

// Helper functions (copied from federations.js)
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRatings(naturalPosition) {
  const positions = ["GK", "DF", "MD", "AT"];
  const ratings = {};
  positions.forEach((pos) => {
    ratings[pos] = pos === naturalPosition ? rand(50, 100) : rand(0, 50);
  });
  return ratings;
}

function generateSquad() {
  const firstNames = ["Kofi", "Yaw", "Kwame", "Amara", "Chidi", "Sadio", "Riyad", "Mohamed", "Victor", "Samuel", "Joel", "Thomas", "Jordan", "Andre", "Eric", "Emmanuel", "Daniel", "Peter", "Paul", "John", "David", "Simon", "Isaac"];
  const lastNames = ["Mensah", "Osei", "Boateng", "Diallo", "Traore", "Kone", "Salah", "Mane", "Mahrez", "Aubameyang", "Osimhen", "Eto'o", "Drogba", "Yaya", "Kessie", "Zaha", "Kudus", "Sarr", "Bennacer", "Hakimi"];
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
  players[Math.floor(Math.random() * 23)].isCaptain = true;
  return players;
}

// POST /api/seed — creates N demo federations with their representative users
router.post("/", async (req, res) => {
  try {
    const countries = [
      { country: "Ghana", manager: "Otto Addo" },
      { country: "Senegal", manager: "Aliou Cissé" },
      { country: "Egypt", manager: "Hossam Hassan" },
      { country: "Morocco", manager: "Walid Regragui" },
      { country: "Ivory Coast", manager: "Emerse Faé" },
      { country: "South Africa", manager: "Hugo Broos" },
      { country: "Cameroon", manager: "Marc Brys" },
    ];

    const created = [];

    for (const c of countries) {
      const email = `${c.country.toLowerCase().replace(/\s+/g, "")}@anl.test`;
      const existingUser = await User.findOne({ email });
      const existingFed = await Federation.findOne({ country: c.country });

      if (existingUser || existingFed) {
        created.push({ country: c.country, skipped: true });
        continue;
      }

      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await User.create({
        email,
        password: hashedPassword,
        role: "rep",
      });

      const squad = generateSquad();
      const total = squad.reduce((sum, p) => sum + p.ratings[p.naturalPosition], 0);
      const countryRating = Math.round((total / squad.length) * 100) / 100;

      const federation = await Federation.create({
        country: c.country,
        manager: c.manager,
        representativeId: user._id,
        players: squad,
        countryRating,
      });

      await User.findByIdAndUpdate(user._id, { federationId: federation._id });

      created.push({
        country: c.country,
        manager: c.manager,
        countryRating,
        email,
        password: "password123",
      });
    }

    res.json({ message: "Seed complete", created });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;