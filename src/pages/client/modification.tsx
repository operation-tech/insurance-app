import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function Modification() {
  const { user } = useAuth();

  const [field, setField] = useState("");
  const [newValue, setNewValue] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- Ensure Client Exists ---------------- */
  useEffect(() => {
    const checkClient = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setError("Client profile not found.");
      }

      setLoading(false);
    };

    checkClient();
  }, [user]);

  /* ---------------- Submit Modification Request ---------------- */
  const handleSubmit = async () => {
    setError("");

    if (!field || !newValue || !notes) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      /* 1️⃣ Get client id */
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (clientError || !client) {
        throw new Error("Client not found");
      }

      /* 2️⃣ Insert modification request */
      const { data, error } = await supabase
        .from("requests")
        .insert({
          client_id: client.id,
          request_type: "modification",
          status: "pending",
          metadata: {
            field,
            new_value: newValue,
            card_number: cardNumber || null,
            notes,
          },
        })
        .select("request_ref")
        .single();

      if (error) throw error;
      if (!data?.request_ref)
        throw new Error("Request reference not returned");

      alert(`✅ Modification request submitted\nRef: ${data.request_ref}`);

      /* 3️⃣ Reset form */
      setField("");
      setNewValue("");
      setCardNumber("");
      setNotes("");
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">✏️ Modify Member</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Field to Modify */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Field to Modify *</label>
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Select Field --</option>
          <option value="full_name">Name</option>
          <option value="national_id">National ID</option>
          <option value="branch">Branch</option>
          <option value="plan">Plan</option>
          <option value="phone">Phone Number</option>
        </select>
      </div>

      {/* New Value */}
      <div className="mb-4">
        <label className="block font-medium mb-1">New Value *</label>
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Enter new value"
        />
      </div>

      {/* Card Number */}
      <div className="mb-4">
        <label className="block font-medium mb-1">
          Card Number (if applicable)
        </label>
        <input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Optional"
        />
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block font-medium mb-1">
          Description / Notes *
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2"
          placeholder="Explain the reason for modification"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        {submitting ? "Submitting..." : "Submit Modification Request"}
      </button>
    </div>
  );
}
