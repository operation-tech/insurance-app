import { useState, useEffect } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/jadwa-logo.png";
import { Bell, User, LogOut, ChevronDown, ChevronUp, PlusCircle, XCircle, Pencil } from "lucide-react";

export default function ClientLayout() {
  const [openRequests, setOpenRequests] = useState(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/client/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/client/login", { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* 🔷 FULL-WIDTH TOP BAR */}
      <header className="bg-[#247C94] text-white px-6 py-3 flex justify-between items-center shadow-md">
        <h2 className="text-lg font-semibold tracking-wide">Client Portal</h2>

        <div className="flex items-center gap-6 text-white">

          {/* Notification Icon */}
          <button className="relative hover:text-yellow-200 transition">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Email */}
          <div className="flex items-center gap-2">
            <User className="w-6 h-6" />
            <span className="font-medium">{user.email}</span>
          </div>

          {/* Logout Icon */}
          <button
            onClick={handleLogout}
            className="hover:text-yellow-300 transition"
          >
            <LogOut className="w-6 h-6" />
          </button>

        </div>
      </header>

      {/* 🔷 SIDEBAR + CONTENT BELOW TOP BAR */}
      <div className="flex flex-1">

        {/* 🟩 SIDEBAR */}
        <aside className="w-64 bg-white shadow-lg flex flex-col border-r border-gray-200">

          {/* Logo + Email */}
          <div className="p-6 border-b flex flex-col items-center">
            <img src={logo} alt="JADWA Logo" className="w-32 mb-2" />
            <p className="text-sm text-gray-600 truncate text-center">
              {user.email}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-3 text-gray-800">

            {/* Dashboard */}
            <Link
              to="/client/dashboard"
              className="flex items-center gap-2 bg-[#247C94] hover:bg-[#1f6b82] text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <User className="w-5 h-5" />
              Dashboard
            </Link>

            {/* Profile */}
            <Link
              to="/client/profile"
              className="flex items-center gap-2 bg-[#247C94] hover:bg-[#1f6b82] text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <User className="w-5 h-5" />
              My Profile
            </Link>

            {/* Requests Dropdown */}
            <button
              onClick={() => setOpenRequests(!openRequests)}
              className="w-full flex justify-between items-center bg-[#1F8AA4] hover:bg-[#247C94] text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <span className="flex items-center gap-2">
                <FolderIcon />
                Requests
              </span>
              {openRequests ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {openRequests && (
              <div className="ml-4 mt-2 space-y-2">

                <Link
                  to="/client/addition"
                  className="flex items-center gap-2 bg-[#E6F3F5] hover:bg-[#D0EBEF] text-[#247C94] font-medium py-2 px-3 rounded-md"
                >
                  <PlusCircle className="w-5 h-5" />
                  Additions
                </Link>

                <Link
                  to="/client/deletion"
                  className="flex items-center gap-2 bg-[#E6F3F5] hover:bg-[#D0EBEF] text-[#247C94] font-medium py-2 px-3 rounded-md"
                >
                  <XCircle className="w-5 h-5" />
                  Deletions
                </Link>

                <Link
                  to="/client/modification"
                  className="flex items-center gap-2 bg-[#E6F3F5] hover:bg-[#D0EBEF] text-[#247C94] font-medium py-2 px-3 rounded-md"
                >
                  <Pencil className="w-5 h-5" />
                  Modifications
                </Link>

              </div>
            )}

            {/* My Requests */}
            <Link
              to="/client/my-requests"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <FolderIcon />
              My Requests
            </Link>

            {/* Active List */}
            <Link
              to="/client/active-list"
              className="flex items-center gap-2 bg-[#247C94] hover:bg-[#1f6b82] text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <CheckIcon />
              Active List
            </Link>

          </nav>
        </aside>

        {/* 🟩 MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* Helper Icons (Lucide doesn't have some names directly) */
function FolderIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7h5l2 3h11v9H3z" /></svg>;
}

function CheckIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>;
}
