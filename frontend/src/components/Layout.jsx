import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <NavBar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-center text-sm text-gray-500 py-4">
        African Nations League · INF4001N Project
      </footer>
    </div>
  );
}