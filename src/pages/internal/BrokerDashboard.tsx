import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BrokerDashboard = () => {
  const [clientCount, setClientCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      // Clients
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      setClientCount(clientsCount || 0);

      // Pending Requests
      const { count: pending } = await supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingCount(pending || 0);

      // Active Policies
      const { count: active } = await supabase
        .from("policies")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      setActiveCount(active || 0);
    };

    fetchCounts();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-4">Welcome, Ahmed!</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-lg font-medium text-gray-600">Total Clients</h2>
          <p className="text-2xl font-bold text-blue-600 mt-2">{clientCount}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-lg font-medium text-gray-600">Pending Requests</h2>
          <p className="text-2xl font-bold text-yellow-500 mt-2">{pendingCount}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-lg font-medium text-gray-600">Active Policies</h2>
          <p className="text-2xl font-bold text-green-500 mt-2">{activeCount}</p>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
