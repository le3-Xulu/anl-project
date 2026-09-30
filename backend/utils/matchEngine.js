// Simple match simulation engine

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Given two ratings, returns expected goals for each side
function expectedGoals(ratingA, ratingB) {
  const diff = ratingA - ratingB;
  // Base xG ~1.3 goals; difference of ±20 shifts it by ±0.9
  const baseA = 1.3 + diff * 0.045;
  const baseB = 1.3 - diff * 0.045;
  return {
    a: Math.max(0.2, baseA),
    b: Math.max(0.2, baseB),
  };
}

// Poisson-ish random goals from an expected value
function goalsFromXG(xg) {
  let goals = 0;
  let p = Math.exp(-xg);
  let cumulative = p;
  const r = Math.random();
  while (r > cumulative && goals < 7) {
    goals++;
    p = (p * xg) / goals;
    cumulative += p;
  }
  return goals;
}

// Pick a random scorer from a squad, weighted toward AT, then MD, then DF
function pickScorer(squad) {
  const attackers = squad.filter((p) => p.naturalPosition === "AT");
  const midfielders = squad.filter((p) => p.naturalPosition === "MD");
  const defenders = squad.filter((p) => p.naturalPosition === "DF");

  const roll = Math.random();
  let pool;
  if (roll < 0.55 && attackers.length) pool = attackers;
  else if (roll < 0.85 && midfielders.length) pool = midfielders;
  else if (defenders.length) pool = defenders;
  else pool = attackers.length ? attackers : squad;

  return pool[Math.floor(Math.random() * pool.length)];
}

// Generate a list of goals for a match
function generateGoals(teamA, teamB, scoreA, scoreB) {
  const goals = [];

  for (let i = 0; i < scoreA; i++) {
    const scorer = pickScorer(teamA.players);
    goals.push({
      playerName: scorer.name,
      teamId: teamA._id,
      minute: randInt(1, 90),
    });
  }

  for (let i = 0; i < scoreB; i++) {
    const scorer = pickScorer(teamB.players);
    goals.push({
      playerName: scorer.name,
      teamId: teamB._id,
      minute: randInt(1, 90),
    });
  }

  goals.sort((a, b) => a.minute - b.minute);
  return goals;
}

// Main simulation function
function simulateMatch(teamA, teamB) {
  const { a: xgA, b: xgB } = expectedGoals(teamA.countryRating, teamB.countryRating);

  let scoreA = goalsFromXG(xgA);
  let scoreB = goalsFromXG(xgB);

  let wentToExtraTime = false;
  let wentToPenalties = false;
  let penaltyA = 0;
  let penaltyB = 0;

  // If tied at 90 → extra time
  if (scoreA === scoreB) {
    wentToExtraTime = true;
    // 30 more minutes → roughly a third more likely to score
    if (Math.random() < xgA / 3) scoreA++;
    if (Math.random() < xgB / 3) scoreB++;

    // Still tied → penalties
    if (scoreA === scoreB) {
      wentToPenalties = true;
      penaltyA = randInt(3, 5);
      penaltyB = randInt(3, 5);
      while (penaltyA === penaltyB) {
        penaltyA++;
      }
    }
  }

  const goals = generateGoals(teamA, teamB, scoreA, scoreB);

  let winner;
  if (scoreA > scoreB) winner = teamA._id;
  else if (scoreB > scoreA) winner = teamB._id;
  else winner = penaltyA > penaltyB ? teamA._id : teamB._id;

  return {
    scoreA,
    scoreB,
    goals,
    winner,
    wentToExtraTime,
    wentToPenalties,
    penaltyA,
    penaltyB,
  };
}

module.exports = { simulateMatch };