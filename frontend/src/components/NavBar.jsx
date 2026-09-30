import { Link, useNavigate } from "react-router-dom";
import { getUser, logout } from "../api/auth";

export default function NavBar() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate("/login");
    window.location.reload();
  }

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="font-bold text-lg">African Nations League</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/bracket" className="hover:underline">
            Bracket
          </Link>
          <Link to="/scorers" className="hover:underline">
            Scorers
          </Link>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="hover:underline font-semibold">
                  Admin
                </Link>
              )}
              {user.role === "rep" && (
                <Link to="/register-team" className="hover:underline font-semibold">
                  My Team
                </Link>
              )}
              <span className="text-green-200">|</span>
              <span className="text-green-200">{user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}