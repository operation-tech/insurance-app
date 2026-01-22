import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";


export default function ProtectedRoute({
  children,
  redirectTo = "/",
}: {
children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
