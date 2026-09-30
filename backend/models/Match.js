const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Federation", required: true },
    minute: { type: Number, required: true },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    round: {
      type: String,
      enum: ["QF", "SF", "F"],
      required: true,
    },
    matchNumber: { type: Number, required: true },
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: "Federation" },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: "Federation" },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    goals: [goalSchema],
    type: {
      type: String,
      enum: ["played", "simulated"],
      default: "simulated",
    },
    commentary: [
      {
        minute: Number,
        text: String,
      },
    ],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Federation" },
    status: {
      type: String,
      enum: ["scheduled", "completed"],
      default: "scheduled",
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);