import { Navigate } from "react-router-dom";
import { useRoles } from "../context/RoleContext";
import React from "react";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useRoles();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/client/dashboard" replace />;

  return <>{children}</>;
};

export default AdminRoute;
