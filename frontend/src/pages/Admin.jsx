import { useEffect, useState } from "react";
import API from "../api/client";

export default function Admin() {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await API.get("/tournaments/current");
      setTournament(res.data);
    } catch {
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function flash(msg, isError = false) {
    if (isError) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 4000);
  }

  async function startTournament() {
    setBusy(true);
    try {
      await API.post("/tournaments/start");
      flash("Tournament started!");
      await load();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to start.", true);
    } finally {
      setBusy(false);
    }
  }

  async function restartTournament() {
    if (!window.confirm("Restart the tournament? All matches will be wiped.")) return;
    setBusy(true);
    try {
      await API.post("/tournaments/restart");
      flash("Tournament restarted!");
      await load();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to restart.", true);
    } finally {
      setBusy(false);
    }
  }

  async function simulateMatch(matchId) {
    setBusy(true);
    try {
      await API.post(`/tournaments/match/${matchId}/simulate`);
      flash("Match simulated.");
      await load();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to simulate.", true);
    } finally {
      setBusy(false);
    }
  }

  async function playMatch(matchId) {
    setBusy(true);
    try {
      await API.post(`/tournaments/match/${matchId}/play`);
      flash("Match played with AI commentary!");
      await load();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to play.", true);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading admin...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded p-3">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3">
          {error}
        </div>
      )}

      {/* Main actions */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-wrap gap-3">
        <button
          onClick={startTournament}
          disabled={busy}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          Start Tournament
        </button>
        <button
          onClick={restartTournament}
          disabled={busy}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded disabled:opacity-50"
        >
          Restart Tournament
        </button>
      </div>

      {/* Bracket with play/simulate buttons */}
      {tournament ? (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Matches ({tournament.matches.length})
          </h2>
          <div className="space-y-3">
            {tournament.matches.map((m) => (
              <div
                key={m._id}
                className="border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-gray-500 mb-1">
                    {m.round === "F" ? "Final" : m.round} · Match {m.matchNumber}
                  </p>
                  <p className="font-semibold">
                    {m.teamA?.country || "TBD"} vs {m.teamB?.country || "TBD"}
                  </p>
                  {m.status === "completed" && (
                    <p className="text-sm text-green-700 font-semibold mt-1">
                      {m.scoreA} - {m.scoreB} · Winner: {m.winner?.country || "?"}
                    </p>
                  )}
                </div>

                {m.status === "scheduled" && m.teamA && m.teamB && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => simulateMatch(m._id)}
                      disabled={busy}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
                    >
                      Simulate
                    </button>
                    <button
                      onClick={() => playMatch(m._id)}
                      disabled={busy}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
                    >
                      Play (with AI)
                    </button>
                  </div>
                )}

                {m.status === "completed" && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {m.type === "played" ? "Played" : "Simulated"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 font-semibold">
            No active tournament. Click "Start Tournament" to create one.
          </p>
        </div>
      )}
    </div>
  );
}