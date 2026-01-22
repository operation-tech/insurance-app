// src/pages/client/ActiveList.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";


export default function ActiveList() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveMembers = async () => {
      if (!user) return;
      setLoading(true);

      /* 1️⃣ Get client.id from logged-in user */
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (clientError || !client) {
        console.error("Client not found", clientError);
        setMembers([]);
        setLoading(false);
        return;
      }

      /* 2️⃣ Fetch ACTIVE members */
      const { data, error } = await supabase
        .from("members")
        .select(`
          id,
          hr_code,
          card_number,
          full_name,
          national_id,
          policy_number,
          insurance_type,
          status,
          start_date,
          created_at
        `)
        .eq("client_id", client.id)
        .eq("status", "Active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching active members:", error);
        setMembers([]);
      } else {
        setMembers(data || []);
      }

      setLoading(false);
    };

    fetchActiveMembers();
  }, [user]);

  /* ---------------- Export Excel ---------------- */
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      members.map((m) => ({
        "Full Name": m.full_name,
        "National ID": m.national_id,
        "Policy Number": m.policy_number || "-",
        "Insurance Type": m.insurance_type || "-",
        Status: m.status,
        "Joined At": m.start_date || m.created_at?.split("T")[0],
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Active Members");
    XLSX.writeFile(wb, "Active_Members_List.xlsx");
  };

  /* ---------------- Export PDF ---------------- */
  const exportToPDF = () => {
    
    const doc = new jsPDF();
    autoTable(doc, {
      startY: 25,
      head: [
        [
          "Full Name",
          "National ID",
          "Policy Number",
          "Insurance Type",
          "Status",
          "Joined At",
        ],
      ],
      body: members.map((m) => [
        m.full_name,
        m.national_id,
        m.policy_number || "-",
        m.insurance_type || "-",
        m.status,
        m.start_date || m.created_at?.split("T")[0],
      ]),
    });

    doc.save("Active_Members_List.pdf");
  };

 /* ---------------- UI ---------------- */
if (loading) {
  return (
    <div className="flex justify-center items-center h-64 text-gray-500">
      Loading active members...
    </div>
  );
}

return (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-jadwa">
        🧾 Active Members List
      </h1>

      <div className="space-x-2">
        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Export Excel
        </button>
        <button
          onClick={exportToPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Export PDF
        </button>
      </div>
    </div>

    {members.length === 0 ? (
      <p className="text-center text-gray-500 italic">
        No active members found.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-jadwa text-white">
            <tr>
              <th className="py-3 px-4 text-left">Full Name</th>
              <th className="py-3 px-4 text-left">National ID</th>
              <th className="py-3 px-4 text-left">HR Code</th>
              <th className="py-3 px-4 text-left">Card Number</th>
              <th className="py-3 px-4 text-left">Policy Number</th>
              <th className="py-3 px-4 text-left">Insurance Type</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Joined At</th>
            </tr>
          </thead>

          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{m.full_name}</td>
                <td className="py-3 px-4">{m.national_id}</td>
                <td className="py-3 px-4">{m.hr_code || "-"}</td>
                <td className="py-3 px-4">{m.card_number || "-"}</td>
                <td className="py-3 px-4">{m.policy_number || "-"}</td>
                <td className="py-3 px-4">{m.insurance_type || "-"}</td>
                <td className="py-3 px-4">{m.status}</td>
                <td className="py-3 px-4">
                  {m.start_date || m.created_at?.split("T")[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
}
