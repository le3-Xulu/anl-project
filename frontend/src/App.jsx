import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Bracket from "./pages/Bracket";
import Scorers from "./pages/Scorers";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Match from "./pages/Match";
import Admin from "./pages/Admin";
import RegisterTeam from "./pages/RegisterTeam";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bracket" element={<Bracket />} />
          <Route path="scorers" element={<Scorers />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="match/:matchId" element={<Match />} />
          <Route path="admin" element={<Admin />} />
          <Route path="register-team" element={<RegisterTeam />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
