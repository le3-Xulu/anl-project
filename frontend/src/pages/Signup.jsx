import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, saveSession } from "../api/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("rep");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await signup(email, password, role);
      saveSession(data.token, data.user);
      if (role === "rep") {
        navigate("/register-team");
      } else {
        navigate("/");
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">
        Create an Account
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am a...
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-green-600"
          >
            <option value="rep">Federation Representative</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-2 rounded disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-green-700 font-semibold hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}