import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

/* ---------------- TYPES ---------------- */

interface Client {
  id: string;
  user_id: string;
  // add other client fields here as needed
}

interface ClientContextType {
  client: Client | null;
  loading: boolean;
  fetchClientData: (userId: string) => Promise<void>;
  setClient: React.Dispatch<React.SetStateAction<Client | null>>;
}

/* ---------------- CONTEXT ---------------- */

const ClientContext = createContext<ClientContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClientData = async (userId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch client:", error);
      setClient(null);
    } else {
      setClient(data);
    }

    setLoading(false);
  };

  return (
    <ClientContext.Provider
      value={{ client, loading, fetchClientData, setClient }}
    >
      {children}
    </ClientContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within ClientProvider");
  }
  return context;
};
