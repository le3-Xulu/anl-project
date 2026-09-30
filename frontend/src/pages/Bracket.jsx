import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/client";

export default function Bracket() {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await API.get("/tournaments/current");
        setTournament(res.data);
      } catch {
        setTournament(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-500">Loading bracket...</p>;
  if (!tournament)
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-semibold">
          No tournament is currently running.
        </p>
      </div>
    );

  // Group matches by round
  const qf = tournament.matches.filter((m) => m.round === "QF");
  const sf = tournament.matches.filter((m) => m.round === "SF");
  const final = tournament.matches.filter((m) => m.round === "F");

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-1">
          Road to the Final
        </h1>
        <p className="text-gray-600">
          {tournament.name} · {tournament.status}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
        <div className="flex gap-10 items-stretch min-w-max">
          {/* Quarter Finals */}
          <div className="flex flex-col justify-around gap-4 min-w-[280px]">
            <h2 className="text-center font-bold text-gray-700 mb-2">
              Quarter Finals
            </h2>
            {qf.length === 0 ? (
              <p className="text-sm text-gray-400 text-center">Not created yet</p>
            ) : (
              qf.map((m) => <MatchCard key={m._id} match={m} />)
            )}
          </div>

          {/* Semi Finals */}
          <div className="flex flex-col justify-around gap-4 min-w-[280px]">
            <h2 className="text-center font-bold text-gray-700 mb-2">
              Semi Finals
            </h2>
            {sf.length === 0 ? (
              <p className="text-sm text-gray-400 text-center">
                Awaiting QF results
              </p>
            ) : (
              sf.map((m) => <MatchCard key={m._id} match={m} />)
            )}
          </div>

          {/* Final */}
          <div className="flex flex-col justify-center gap-4 min-w-[280px]">
            <h2 className="text-center font-bold text-gray-700 mb-2">Final</h2>
            {final.length === 0 ? (
              <p className="text-sm text-gray-400 text-center">
                Awaiting SF results
              </p>
            ) : (
              final.map((m) => <MatchCard key={m._id} match={m} highlight />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, highlight }) {
  const completed = match.status === "completed";
  const winnerId = match.winner?._id?.toString();

  return (
    <Link
      to={`/match/${match._id}`}
      className={`block border rounded-lg p-3 hover:shadow-md transition ${
        highlight ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-xs text-gray-500 mb-2">Match {match.matchNumber}</div>
      <div
        className={`flex justify-between items-center mb-1 ${
          winnerId === match.teamA?._id?.toString() ? "font-bold text-green-800" : ""
        }`}
      >
        <span>{match.teamA?.country || "TBD"}</span>
        <span>{match.scoreA}</span>
      </div>
      <div
        className={`flex justify-between items-center ${
          winnerId === match.teamB?._id?.toString() ? "font-bold text-green-800" : ""
        }`}
      >
        <span>{match.teamB?.country || "TBD"}</span>
        <span>{match.scoreB}</span>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        {completed ? `Completed (${match.type})` : "Scheduled"}
      </div>
    </Link>
  );
}