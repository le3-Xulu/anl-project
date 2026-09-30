const { GoogleGenerativeAI } = require("@google/generative-ai");
 function fallbackCommentary(teamA, teamB, result) {
  const events = [];
  events.push({
    minute: 0,
    text: `Kick-off! ${teamA.country} take on ${teamB.country} in this crucial knockout clash.`,
  });
  result.goals.forEach((g) => {
    const teamName =
      g.teamId.toString() === teamA._id.toString()
        ? teamA.country
        : teamB.country;
    events.push({
      minute: g.minute,
      text: `GOAL! ${g.playerName} finds the back of the net for ${teamName}.`,
    });
  });
  events.push({
    minute: 90,
    text: `Full-time: ${teamA.country} ${result.scoreA} - ${result.scoreB} ${teamB.country}. The referee blows the final whistle.`,
  });
  return events.sort((a, b) => a.minute - b.minute);
}

async function generateCommentary(teamA, teamB, result) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [
      { minute: 0, text: "AI commentary unavailable (no API key configured)." },
    ];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
 const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const goalSummary = result.goals
    .map((g) => {
      const teamName =
        g.teamId.toString() === teamA._id.toString()
          ? teamA.country
          : teamB.country;
      return `${g.minute}' - ${g.playerName} (${teamName})`;
    })
    .join("\n");

  const captainA = teamA.players.find((p) => p.isCaptain)?.name || "the captain";
  const captainB = teamB.players.find((p) => p.isCaptain)?.name || "the captain";

  const prompt = `
You are a football match commentator. Write a short, exciting play-by-play commentary for the following African Nations League match.

Match: ${teamA.country} (rating ${teamA.countryRating}) vs ${teamB.country} (rating ${teamB.countryRating})
Final score: ${teamA.country} ${result.scoreA} - ${result.scoreB} ${teamB.country}
${result.wentToExtraTime ? "The match went to extra time." : ""}
${result.wentToPenalties ? `Penalties: ${teamA.country} ${result.penaltyA} - ${result.penaltyB} ${teamB.country}` : ""}

Goal scorers:
${goalSummary || "No goals"}

Captains: ${teamA.country} - ${captainA}; ${teamB.country} - ${captainB}

Return ONLY a JSON array of commentary moments (no extra text, no markdown). Each item must have:
- "minute": a number between 0 and 120
- "text": a short, dramatic sentence

Include 8-12 moments, including the kickoff, key goals, and full-time. Also include 1-2 interesting tactical observations about one of the teams.
`;

   // Retry up to 3 times if Google's servers are busy (503/429)
    let text;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await model.generateContent(prompt);
        text = response.response.text();
        break;
      } catch (err) {
        const isBusy =
          err.message && (err.message.includes("503") || err.message.includes("429"));
        if (isBusy && attempt < 2) {
          console.log(`Gemini busy, retrying (attempt ${attempt + 2}/3)...`);
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    console.log("AI failed, using fallback commentary:", err.message);
    return fallbackCommentary(teamA, teamB, result);
  }

  // Strip markdown fences if present
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed.sort((a, b) => a.minute - b.minute);
  } catch (err) {
    return [
      { minute: 0, text: "Commentary generated but could not be parsed." },
      { minute: 90, text: text.slice(0, 500) },
    ];
  }
}

module.exports = { generateCommentary };