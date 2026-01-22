import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";

export default function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 Fetch requests
  const fetchRequests = async () => {
    if (!user) return;

    setRefreshing(true);
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      console.error("Client not found:", clientError);
      setLoading(false);
      setRefreshing(false);
      return;
    }

   const { data, error } = await supabase
  .from("requests")
  .select(`
    id,
    request_ref,
    request_type,
    status,
    created_at,
    request_members (
      name,
      nid,
      phone,
      dob,
      gender,
      relation,
      principal_number,
      plan,
      salary
    )
  `)
  .eq("client_id", client.id)
  .order("created_at", { ascending: false });


    if (error) console.error("Error fetching requests:", error);
    else setRequests(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  if (loading) return <p className="p-6 text-gray-600">Loading requests...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">📋 My Requests</h1>
          <button
            onClick={fetchRequests}
            disabled={refreshing}
            className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition ${
              refreshing ? "opacity-70 cursor-wait" : ""
            }`}
          >
            <RefreshCcw size={18} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="text-gray-500">No requests found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2 text-center">Request No.</th>
                <th className="border px-3 py-2 text-center">Type</th>
                <th className="border px-3 py-2 text-center">Status</th>
                <th className="border px-3 py-2 text-center">Date</th>
                <th className="border px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, index) => {
                const members = r.request_members || [];

                return (
                  <>
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-center font-semibold text-blue-700">
                        {r.request_ref || "—"}
                      </td>
                      <td className="border px-3 py-2 capitalize text-center">
                        {r.request_type}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            r.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : r.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() =>
                            setExpandedRow(expandedRow === index ? null : index)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center w-full"
                        >
                          {expandedRow === index ? (
                            <>
                              Hide Details <ChevronUp size={16} className="ml-1" />
                            </>
                          ) : (
                            <>
                              View Details{" "}
                              <ChevronDown size={16} className="ml-1" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {expandedRow === index && (
  <tr>
    <td colSpan={5} className="bg-gray-50 p-4 border-t">
      <h3 className="font-semibold text-gray-700 mb-2">
        Request Details:
      </h3>

      {members.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">NID</th>
                <th className="border px-2 py-1">Phone</th>
                <th className="border px-2 py-1">DOB</th>
                <th className="border px-2 py-1">Gender</th>
                <th className="border px-2 py-1">Relation</th>
                <th className="border px-2 py-1">Principal</th>
                <th className="border px-2 py-1">Plan</th>
                <th className="border px-2 py-1">Salary</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any, i: number) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{m.name}</td>
                  <td className="border px-2 py-1">{m.nid}</td>
                  <td className="border px-2 py-1">{m.phone}</td>
                  <td className="border px-2 py-1">{m.dob}</td>
                  <td className="border px-2 py-1">{m.gender}</td>
                  <td className="border px-2 py-1">{m.relation}</td>
                  <td className="border px-2 py-1">
                    {m.principal_number || "-"}
                  </td>
                  <td className="border px-2 py-1">{m.plan}</td>
                  <td className="border px-2 py-1">
                    {m.salary ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 italic">
          No member details available.
        </p>
      )}
    </td>
  </tr>
)}

                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
