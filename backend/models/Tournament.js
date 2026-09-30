const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "African Nations League" },
    status: {
      type: String,
      enum: ["registration", "active", "completed"],
      default: "registration",
    },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Federation" }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
    currentRound: {
      type: String,
      enum: ["QF", "SF", "F", null],
      default: null,
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Federation", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);