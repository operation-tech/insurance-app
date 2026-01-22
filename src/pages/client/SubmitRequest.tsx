import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function SubmitRequest() {
  const { user } = useAuth();
  const [type, setType] = useState("addition"); // default request type
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("requests").insert([
      {
        client_id: user?.id, // 🔹 link request to logged-in client
        type: type,
        details: details,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("✅ Request submitted successfully!");
      setDetails(""); // reset form
      setType("addition");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Submit a Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Type */}
        <div>
          <label className="block mb-1 font-medium">Request Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="addition">Addition</option>
            <option value="deletion">Deletion</option>
            <option value="support">Support</option>
          </select>
        </div>

        {/* Request Details */}
        <div>
          <label className="block mb-1 font-medium">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe your request..."
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
