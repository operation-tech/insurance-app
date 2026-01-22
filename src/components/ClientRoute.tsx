import { Navigate } from "react-router-dom";
import { useRoles } from "../context/RoleContext";
import React from "react";

const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const { isClient, loading } = useRoles();

  if (loading) return null;
  if (!isClient) return <Navigate to="/internal/dashboard" replace />;

  return <>{children}</>;
};

export default ClientRoute;
