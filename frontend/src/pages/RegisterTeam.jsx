import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/client";
import { getUser } from "../api/auth";

export default function RegisterTeam() {
  const navigate = useNavigate();
  const user = getUser();
  const [country, setCountry] = useState("");
  const [manager, setManager] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/federations/register", { country, manager });
      alert(`✅ ${res.data.federation.country} registered! Rating: ${res.data.federation.countryRating}`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-6 text-center">
        <p className="text-yellow-800">Please log in to register a team.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-green-800 mb-2 text-center">
        Register Your Federation
      </h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        A squad of 23 players with auto-generated ratings will be created for you.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            placeholder="e.g. Nigeria"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manager Name
          </label>
          <input
            type="text"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            required
            placeholder="e.g. Jose Peseiro"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-2 rounded disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register Federation"}
        </button>
      </form>
    </div>
  );
}