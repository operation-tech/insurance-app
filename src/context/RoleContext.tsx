import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Role = "admin" | "client";

interface RoleContextType {
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading roles:", error);
        setRoles([]);
      } else {
        setRoles(data.map(r => r.role));
      }

      setLoading(false);
    };

    loadRoles();
  }, [user]);

  return (
    <RoleContext.Provider
      value={{
        roles,
        loading,
        isAdmin: roles.includes("admin"),
        isClient: roles.includes("client"),
      }}
    >
      {!loading && children}
    </RoleContext.Provider>
  );
};

export const useRoles = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRoles must be used within RoleProvider");
  return ctx;
};
