import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp, Check, X, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ---------------------------------------------------
      STORAGE HELPERS (FIX)
  --------------------------------------------------- */
  const getCardPdfUrl = (path: string | null) => {
    if (!path) return null;

    const { data } = supabase.storage
      .from("insurance_cards") // ✅ correct bucket
      .getPublicUrl(path);

    return data?.publicUrl || null;
  };

  /* ---------------------------------------------------
      FETCH REQUESTS
  --------------------------------------------------- */
  const fetchRequests = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        clients:client_id ( company_name ),
        request_members(*)
      `)
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  /* ---------------------------------------------------
      SEND REQUEST TO INSURANCE
  --------------------------------------------------- */
  const sendToInsurance = async (req: any) => {
    try {
      setUpdating("send-" + req.id);

      const { error } = await supabase.functions.invoke(
        "send-addition-request",
        { body: { request_id: req.id } }
      );

      if (error) {
        alert("Failed to send request to insurance.");
        return;
      }

      await supabase
        .from("requests")
        .update({
          status: "sent_to_insurer",
          sent_to_insurance_at: new Date().toISOString(),
        })
        .eq("id", req.id);

      alert("✅ Request sent to insurance successfully.");
      await fetchRequests();
    } finally {
      setUpdating(null);
    }
  };

  /* ---------------------------------------------------
      UPDATE MEMBER FIELD
  --------------------------------------------------- */
  const updateMemberField = async (
    requestId: string,
    memberId: string,
    field: string,
    value: any
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id !== requestId
          ? r
          : {
              ...r,
              request_members: r.request_members.map((m: any) =>
                m.id === memberId ? { ...m, [field]: value } : m
              ),
            }
      )
    );

    await supabase
      .from("request_members")
      .update({ [field]: value })
      .eq("id", memberId);
  };

  /* ---------------------------------------------------
      APPROVE / REJECT
  --------------------------------------------------- */
  const approveMember = async (_requestId: string, member: any) => {
    if (!member.card_number) {
      alert("Card number is required before approval.");
      return;
    }

    setUpdating(member.id);

    await supabase
      .from("request_members")
      .update({
        approval_status: "approved",
        rejection_reason: null,
      })
      .eq("id", member.id);

    setUpdating(null);
    await fetchRequests();
  };

  const rejectMember = async (_requestId: string, member: any) => {
    if (!member.rejection_reason) {
      alert("Enter rejection reason.");
      return;
    }

    setUpdating(member.id);

    await supabase
      .from("request_members")
      .update({
        approval_status: "rejected",
        card_number: null,
        card_pdf_url: null,
      })
      .eq("id", member.id);

    setUpdating(null);
    await fetchRequests();
  };

  /* ---------------------------------------------------
      BULK ACTIONS
  --------------------------------------------------- */
  const approveAllWithCards = async (req: any) => {
    const ids = req.request_members
      .filter((m: any) => m.card_number && m.approval_status !== "approved")
      .map((m: any) => m.id);

    if (!ids.length) return;

    setUpdating("bulk-approve-" + req.id);

    await supabase
      .from("request_members")
      .update({ approval_status: "approved", rejection_reason: null })
      .in("id", ids);

    setUpdating(null);
    await fetchRequests();
  };

  const rejectAllWithoutCards = async (req: any) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    const ids = req.request_members
      .filter((m: any) => !m.card_number && m.approval_status !== "rejected")
      .map((m: any) => m.id);

    if (!ids.length) return;

    setUpdating("bulk-reject-" + req.id);

    await supabase
      .from("request_members")
      .update({
        approval_status: "rejected",
        rejection_reason: reason,
        card_number: null,
        card_pdf_url: null,
      })
      .in("id", ids);

    setUpdating(null);
    await fetchRequests();
  };

  /* ---------------------------------------------------
      EXPORT EXCEL
  --------------------------------------------------- */
  const exportRequestToExcel = (req: any) => {
    const rows = req.request_members.map((m: any) => ({
      Name: m.name,
      NID: m.nid,
      Plan: m.plan,
      CardNumber: m.card_number || "",
      Status: m.approval_status || "pending",
      RejectionReason: m.rejection_reason || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");

    const blob = new Blob(
      [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `request_${req.request_ref || req.id}.xlsx`;
    a.click();
  };

  /* ---------------------------------------------------
      RENDER
  --------------------------------------------------- */
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Requests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isExpanded = expanded[req.id];

            return (
              <div key={req.id} className="bg-white border rounded shadow">
                <div
                  className="flex justify-between p-4 cursor-pointer"
                  onClick={() =>
                    setExpanded((p) => ({ ...p, [req.id]: !isExpanded }))
                  }
                >
                  <div>
                    <p className="font-semibold">
                      {req.clients?.company_name} — {req.request_type}
                    </p>
                    <p className="text-sm text-gray-600">
                      {req.request_members.length} members • {req.status}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 space-y-4">
                    <div className="flex gap-3 flex-wrap">
                      {req.status === "pending" && (
                        <button
                          onClick={() => sendToInsurance(req)}
                          disabled={updating === "send-" + req.id}
                          className="bg-indigo-600 text-white px-3 py-1 rounded"
                        >
                          Send to Insurance
                        </button>
                      )}

                      <button
                        onClick={() => approveAllWithCards(req)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Approve All With Cards
                      </button>

                      <button
                        onClick={() => rejectAllWithoutCards(req)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject All Without Cards
                      </button>

                      <button
                        onClick={() => exportRequestToExcel(req)}
                        className="bg-gray-700 text-white px-3 py-1 rounded flex gap-1"
                      >
                        <Download size={16} /> Export
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2">Name</th>
                            <th className="p-2">NID</th>
                            <th className="p-2">Plan</th>
                            <th className="p-2">Card</th>
                            <th className="p-2">Reason</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.request_members.map((m: any) => {
                            const pdfUrl = getCardPdfUrl(m.card_pdf_url);

                            return (
                              <tr key={m.id} className="border-b">
                                <td className="p-2">{m.name}</td>
                                <td className="p-2">{m.nid}</td>
                                <td className="p-2">{m.plan}</td>

                                <td className="p-2">
                                  <input
                                    value={m.card_number || ""}
                                    disabled={m.approval_status === "approved"}
                                    onChange={(e) =>
                                      updateMemberField(
                                        req.id,
                                        m.id,
                                        "card_number",
                                        e.target.value
                                      )
                                    }
                                    className="border px-2 py-1 w-full"
                                  />

                                  {pdfUrl && (
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block mt-1 text-indigo-600 underline text-xs"
                                    >
                                      📄 View Card PDF
                                    </a>
                                  )}
                                </td>

                                <td className="p-2">
                                  <input
                                    value={m.rejection_reason || ""}
                                    onChange={(e) =>
                                      updateMemberField(
                                        req.id,
                                        m.id,
                                        "rejection_reason",
                                        e.target.value
                                      )
                                    }
                                    className="border px-2 py-1 w-full"
                                  />
                                </td>

                                <td className="p-2">
                                  <span className="px-2 py-1 rounded text-xs bg-gray-100">
                                    {m.approval_status || "pending"}
                                  </span>
                                </td>

                                <td className="p-2 flex gap-2">
                                  <button
                                    onClick={() => approveMember(req.id, m)}
                                    disabled={!m.card_number}
                                    className="text-green-600"
                                  >
                                    <Check />
                                  </button>

                                  <button
                                    onClick={() => rejectMember(req.id, m)}
                                    className="text-red-600"
                                  >
                                    <X />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
