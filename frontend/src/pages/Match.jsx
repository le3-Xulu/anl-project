import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/client";

export default function Match() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await API.get(`/tournaments/match/${matchId}`);
        setMatch(res.data);
      } catch (err) {
        setError("Match not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [matchId]);

  if (loading) return <p className="text-gray-500">Loading match...</p>;
  if (error || !match)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold">{error || "No data"}</p>
      </div>
    );

  const isPlayed = match.type === "played";
  const isCompleted = match.status === "completed";

  return (
    <div className="space-y-6">
      <Link to="/bracket" className="text-green-700 hover:underline text-sm">
        ← Back to Bracket
      </Link>

      {/* Score header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-center text-sm text-gray-500 mb-2">
          {match.round === "F"
            ? "Final"
            : match.round === "SF"
            ? "Semi-Final"
            : "Quarter-Final"}{" "}
          · Match {match.matchNumber}
        </p>

        <div className="flex items-center justify-center gap-8 text-center">
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-800">
              {match.teamA?.country}
            </p>
            <p className="text-sm text-gray-500">
              Rating {match.teamA?.countryRating}
            </p>
          </div>
          <div className="text-4xl font-bold text-green-800">
            {match.scoreA} - {match.scoreB}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-800">
              {match.teamB?.country}
            </p>
            <p className="text-sm text-gray-500">
              Rating {match.teamB?.countryRating}
            </p>
          </div>
        </div>

        {isCompleted && match.winner && (
          <p className="text-center text-green-700 font-semibold mt-4">
            🏆 Winner: {match.winner.country}
          </p>
        )}
        {!isCompleted && (
          <p className="text-center text-yellow-700 font-semibold mt-4">
            ⏳ Match not yet played
          </p>
        )}
      </div>

      {/* Goals */}
      {match.goals && match.goals.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚽ Goals</h2>
          <ul className="space-y-2">
            {match.goals.map((g, i) => (
              <li key={i} className="flex justify-between border-b border-gray-100 pb-2">
                <span>
                  <span className="font-semibold text-green-700 mr-2">
                    {g.minute}'
                  </span>
                  {g.playerName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Commentary (only if "played") */}
      {isPlayed && match.commentary && match.commentary.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🎙️ Commentary
          </h2>
          <ul className="space-y-3">
            {match.commentary.map((c, i) => (
              <li key={i} className="flex gap-3 border-b border-gray-100 pb-3">
                <span className="font-bold text-green-700 min-w-[40px]">
                  {c.minute}'
                </span>
                <span className="text-gray-700">{c.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback: simulated match, no commentary */}
      {isCompleted && !isPlayed && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            This match was <strong>simulated</strong>. No commentary is available.
          </p>
        </div>
      )}
    </div>
  );
}