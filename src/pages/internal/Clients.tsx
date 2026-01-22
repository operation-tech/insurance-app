// src/pages/internal/Clients.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Load clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error loading clients:", error);
      else setClients(data || []);

      setLoading(false);
    };

    fetchClients();
  }, []);

  // Delete client
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) alert("❌ Error: " + error.message);
    else {
      setClients((prev) => prev.filter((c) => c.id !== id));
      alert("✅ Client deleted.");
    }
  };

  // Filter
  const filtered = clients.filter(
    (c) =>
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_person || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return <p className="text-center text-gray-500 mt-8">Loading clients...</p>;

  return (
    <div className="p-6">
      {/* PAGE TITLE */}
      <h1 className="text-2xl font-semibold text-jadwa mb-6">All Clients</h1>

      {/* Search + Add */}
      <div className="flex justify-between mb-6">
        <input
          type="text"
          placeholder="Search by company or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded-lg w-1/3 focus:outline-jadwa"
        />

        <button
          onClick={() => navigate("/internal/clients/add")}
          className="bg-jadwa text-white px-4 py-2 rounded-lg hover:bg-[#1f6b82] transition"
        >
          + Add Client
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-jadwa text-white">
            <tr>
              <th className="py-3 px-4 text-left w-28">Actions</th>
              <th className="py-3 px-4 text-left">Company Name</th>
              <th className="py-3 px-4 text-left">Contact Person</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Insurance Type</th>
              <th className="py-3 px-4 text-left">Account Manager</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-jadwa/10 transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/internal/clients/profile/${c.id}`)}
                        className="text-jadwa hover:text-[#1f6b82]"
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        onClick={() => navigate(`/internal/clients/edit/${c.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4">{c.company_name}</td>
                  <td className="py-3 px-4">{c.contact_person}</td>
                  <td className="py-3 px-4">{c.email}</td>
                  <td className="py-3 px-4">{c.phone}</td>
                  <td className="py-3 px-4">{c.insurance_type}</td>
                  <td className="py-3 px-4">{c["Account manger"]}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-500 py-6 italic"
                >
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
