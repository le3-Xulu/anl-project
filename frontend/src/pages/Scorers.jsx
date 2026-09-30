import { useEffect, useState } from "react";
import API from "../api/client";

export default function Scorers() {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await API.get("/tournaments/scorers");
        setScorers(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-500">Loading scorers...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-800 text-center">
        ⚽ Top Goal Scorers
      </h1>

      {scorers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No goals have been scored yet. Matches must be played or simulated first.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-green-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Country</th>
                <th className="px-4 py-3 text-right">Goals</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-100 ${
                    i < 3 ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-green-800">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{s.playerName}</td>
                  <td className="px-4 py-3 text-gray-600">{s.country}</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">
                    {s.goals}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}