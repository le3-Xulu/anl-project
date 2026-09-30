const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const seedRoutes = require("./routes/seed");
const tournamentRoutes = require("./routes/tournaments");
require("dotenv").config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const authRoutes = require("./routes/auth");
const federationRoutes = require("./routes/federations");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ANL backend is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/federations", federationRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/tournaments", tournamentRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.log("❌ MongoDB error:", err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));