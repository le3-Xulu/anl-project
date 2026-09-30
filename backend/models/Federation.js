const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    naturalPosition: {
      type: String,
      enum: ["GK", "DF", "MD", "AT"],
      required: true,
    },
    isCaptain: { type: Boolean, default: false },
    ratings: {
      GK: { type: Number, min: 0, max: 100, required: true },
      DF: { type: Number, min: 0, max: 100, required: true },
      MD: { type: Number, min: 0, max: 100, required: true },
      AT: { type: Number, min: 0, max: 100, required: true },
    },
  },
  { _id: true }
);

const federationSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    manager: {
      type: String,
      required: true,
      trim: true,
    },
    representativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    players: {
      type: [playerSchema],
      validate: {
        validator: (arr) => arr.length === 23,
        message: "A squad must have exactly 23 players.",
      },
    },
    countryRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Federation", federationSchema);