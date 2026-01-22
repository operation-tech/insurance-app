import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ClientDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/client/login", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // ✅ Main dashboard content only
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Welcome to Your Dashboard
      </h1>
      <p className="text-gray-600">
        Use the sidebar to manage your requests and view your active list.
      </p>
    </div>
  );
}
