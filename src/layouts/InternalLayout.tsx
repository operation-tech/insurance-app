// src/layouts/InternalLayout.tsx

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, User } from "lucide-react";
import logo from "../assets/jadwa-logo.png";
import { useAuth } from "../context/AuthContext";

export default function InternalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkBase =
    "block px-4 py-2 rounded-md font-medium transition-all duration-150";
  const activeClass = "bg-jadwa text-white shadow-sm";
  const inactiveClass =
    "text-gray-700 hover:bg-jadwa/10 hover:text-jadwa";

  const handleLogout = async () => {
    await logout();
    navigate("/internal/login", { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-inter">

      {/* TOP BAR — FULL WIDTH */}
      <header className="bg-jadwa text-white px-6 py-3 flex justify-between items-center shadow-md">
        <h2 className="text-lg font-semibold tracking-wide">Internal System</h2>

        <div className="flex items-center gap-6">

          {/* Notifications */}
          <button className="relative hover:text-yellow-200 transition">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Logged-in Admin */}
          <div className="flex items-center gap-2 hover:text-yellow-200 transition cursor-pointer">
            <User className="w-6 h-6" />
            <span className="font-medium">
              {user?.email}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hover:text-yellow-300 transition"
          >
            <LogOut className="w-6 h-6" />
          </button>

        </div>
      </header>

      {/* SIDEBAR + CONTENT */}
      <div className="flex flex-1">

        {/* SIDEBAR */}
        <aside className="w-64 bg-white shadow-lg flex flex-col border-r border-gray-200">

          {/* LOGO */}
          <div className="p-6 flex items-center justify-center border-b bg-white">
            <img src={logo} alt="JADWA Logo" className="w-32" />
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 p-4 space-y-2">
            <NavLink
              to="/internal/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/internal/clients"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Clients
            </NavLink>

            <NavLink
              to="/internal/requests"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Requests
            </NavLink>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
