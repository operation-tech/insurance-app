import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching client:", error);
      else setClient(data);

      setLoading(false);
    };

    fetchClient();
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setClient((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: string) => {
    setClient((prev: any) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("clients")
      .update(client)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      setMessage("❌ Failed to save changes.");
    } else {
      setMessage("✅ Client updated successfully!");
    }

    setSaving(false);
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading client...</p>;

  if (!client)
    return (
      <p className="text-center mt-10 text-red-500">Client not found.</p>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-[#247C94]">
          Client Profile
        </h1>
        <button
          onClick={() => navigate("/clients")}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          ← Back
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-center ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white shadow-xl rounded-2xl p-6 space-y-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-[#247C94] border-b pb-2">
          Basic Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Company Name", field: "company_name" },
            { label: "Contact Person", field: "contact_person" },
            { label: "Email", field: "email" },
            { label: "Phone", field: "phone" },
            { label: "Insurance Type", field: "insurance_type" },
            { label: "Insurance Company", field: "insurance_company" },
            { label: "Contract Date", field: "contract_date" },
            { label: "Policy Number", field: "policy_number" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="block font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={client[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#247C94] focus:outline-none"
              />
            </div>
          ))}
        </div>

        <hr className="my-4" />

        <h2 className="text-xl font-semibold text-[#247C94] border-b pb-2">
          Portal Configuration
        </h2>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={client.requires_photo || false}
              onChange={() => handleToggle("requires_photo")}
              className="h-5 w-5 accent-[#247C94]"
            />
            Requires Photo Upload
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={client.requires_id_card || false}
              onChange={() => handleToggle("requires_id_card")}
              className="h-5 w-5 accent-[#247C94]"
            />
            Requires ID Card Upload
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={client.requires_signature || false}
              onChange={() => handleToggle("requires_signature")}
              className="h-5 w-5 accent-[#247C94]"
            />
            Requires Signature Upload
          </label>
        </div>

        <div className="mt-6">
          <label className="block font-medium text-gray-700 mb-2">
            Internal Notes
          </label>
          <textarea
            value={client.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="w-full border rounded-lg p-3 h-28 focus:ring-2 focus:ring-[#247C94] focus:outline-none"
            placeholder="Notes about this client..."
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#247C94] text-white px-8 py-2 rounded-lg hover:bg-[#1c667a] transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
