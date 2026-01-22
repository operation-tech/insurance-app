import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

type ReviewRow = {
  member_id: string;
  name: string;
  hr_code: string;
  card_number: string;
  deletion_date: string;
};

export default function Deletion() {
  const { user } = useAuth();

  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [review, setReview] = useState<ReviewRow[]>([]);
  const [search, setSearch] = useState("");
  const [matchedMember, setMatchedMember] = useState<any | null>(null);
  const [deletionDate, setDeletionDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- Load Active Members ---------------- */
  useEffect(() => {
    const loadMembers = async () => {
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) return;

      const { data } = await supabase
        .from("members")
        .select("id, full_name, hr_code, card_number")
        .eq("client_id", client.id)
        .eq("status", "Active");

      setActiveMembers(data || []);
      setLoading(false);
    };

    loadMembers();
  }, [user]);

  /* ---------------- Manual Match ---------------- */
  useEffect(() => {
    if (!search) {
      setMatchedMember(null);
      return;
    }

    const match = activeMembers.find(
      (m) => m.hr_code === search || m.card_number === search
    );

    setMatchedMember(match || null);
  }, [search, activeMembers]);

  const addManual = () => {
    if (!matchedMember || !deletionDate) return;

    setReview((prev) => [
      ...prev,
      {
        member_id: matchedMember.id,
        name: matchedMember.full_name,
        hr_code: matchedMember.hr_code,
        card_number: matchedMember.card_number,
        deletion_date: deletionDate,
      },
    ]);

    setSearch("");
    setDeletionDate("");
    setMatchedMember(null);
  };

  /* ---------------- Excel Upload ---------------- */
  const handleExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      const mapped: ReviewRow[] = [];

      rows.forEach((r) => {
        const match = activeMembers.find(
          (m) =>
            m.hr_code === r.hr_code ||
            m.card_number === r.card_number
        );

        if (match) {
          mapped.push({
            member_id: match.id,
            name: match.full_name,
            hr_code: match.hr_code,
            card_number: match.card_number,
            deletion_date: r.deletion_date,
          });
        }
      });

      setReview((prev) => [...prev, ...mapped]);
    };

    reader.readAsBinaryString(file);
  };

  /* ---------------- Download Template ---------------- */
 const downloadTemplate = async () => {
  const fileUrl =
    "https://ycfccvrkbwvyzdkojeag.supabase.co/storage/v1/object/public/jadwa_template/Deletion/Deletion%20Template.xlsx";

  const response = await fetch(fileUrl);
  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "JADWA Deletion.xlsx";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};


  /* ---------------- Submit ---------------- */
  const submitDeletion = async () => {
    if (!review.length) return;

    setSubmitting(true);
    setError("");

    try {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!client) throw new Error("Client not found");

      const { data: request } = await supabase
        .from("requests")
        .insert({
          client_id: client.id,
          request_type: "deletion",
          status: "pending",
        })
        .select("id, request_ref")
        .single();
          
          if (!request) return;
          for (const r of review) {
          await supabase.from("request_members").insert({
          request_id: request.id,
          client_id: client.id,
          name: r.name,
          hr_code: r.hr_code,
          card_number: r.card_number,
          approval_status: "pending",
          rejection_reason: `Deletion date: ${r.deletion_date}`,
        });
      }

      alert(`✅ Deletion request submitted\nRef: ${request.request_ref}`);
      setReview([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🗑️ Delete Members</h1>

      <button
        onClick={downloadTemplate}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Download Deletion Template
      </button>

      {/* Manual */}
      <div className="mb-6 border p-4 rounded">
        <h3 className="font-semibold mb-2">Manual Deletion</h3>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="HR Code or Card Number"
          className="border px-3 py-2 mr-2"
        />

        <input
          type="date"
          value={deletionDate}
          onChange={(e) => setDeletionDate(e.target.value)}
          className="border px-3 py-2 mr-2"
        />

        <button
          onClick={addManual}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>

        {matchedMember && (
          <div className="mt-2 text-sm text-gray-600">
            Matched: {matchedMember.full_name}
          </div>
        )}
      </div>

      {/* Excel */}
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => e.target.files && handleExcel(e.target.files[0])}
        className="mb-6"
      />

      {/* Review */}
      <table className="w-full border mb-6">
        <thead className="bg-gray-200">
          <tr>
            <th>Name</th>
            <th>HR Code</th>
            <th>Card</th>
            <th>Deletion Date</th>
          </tr>
        </thead>
        <tbody>
          {review.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td>{r.hr_code}</td>
              <td>{r.card_number}</td>
              <td>{r.deletion_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={submitDeletion}
        disabled={submitting}
        className="bg-red-600 text-white px-6 py-2 rounded"
      >
        {submitting ? "Submitting..." : "Submit Deletion Request"}
      </button>
    </div>
  );
}
