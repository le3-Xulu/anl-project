import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/client";

export default function Home() {
  const [tournament, setTournament] = useState(null);
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tourRes, scorersRes] = await Promise.all([
          API.get("/tournaments/current").catch(() => null),
          API.get("/tournaments/scorers").catch(() => ({ data: [] })),
        ]);
        if (tourRes) setTournament(tourRes.data);
        setScorers(scorersRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-green-800 to-green-600 text-white rounded-xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">African Nations League</h1>
        <p className="text-lg opacity-90 mb-6">
          The tournament where Africa's best national teams compete for glory.
        </p>
        <div className="flex gap-3">
          <Link
            to="/bracket"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-2 rounded"
          >
            View Bracket
          </Link>
          <Link
            to="/scorers"
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded"
          >
            Top Scorers
          </Link>
        </div>
      </section>

      {loading ? (
        <p className="text-gray-500">Loading tournament info...</p>
      ) : tournament ? (
        <>
          {/* Stats row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">Teams</p>
              <p className="text-3xl font-bold text-green-800">
                {tournament.teams?.length || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-3xl font-bold text-green-800 capitalize">
                {tournament.status || "—"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <p className="text-sm text-gray-500">Current Round</p>
              <p className="text-3xl font-bold text-green-800">
                {tournament.currentRound || "—"}
              </p>
            </div>
          </section>

          {/* Teams preview */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Participating Nations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tournament.teams?.map((t) => (
                <div
                  key={t._id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-green-500 transition"
                >
                  <p className="font-semibold text-gray-800">{t.country}</p>
                  <p className="text-sm text-gray-500">
                    Rating: {t.countryRating}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Top scorers preview */}
          {scorers.length > 0 && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                ⚽ Top Scorers
              </h2>
              <ul className="space-y-2">
                {scorers.slice(0, 5).map((s, i) => (
                  <li
                    key={i}
                    className="flex justify-between border-b border-gray-100 pb-2"
                  >
                    <span>
                      <span className="font-bold text-green-800 mr-2">
                        {i + 1}.
                      </span>
                      {s.playerName}{" "}
                      <span className="text-sm text-gray-500">
                        ({s.country})
                      </span>
                    </span>
                    <span className="font-bold">{s.goals}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800 font-semibold">
            No tournament is currently running.
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            An administrator needs to start one from the Admin Dashboard.
          </p>
        </section>
      )}
    </div>
  );
}