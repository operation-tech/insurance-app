import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/* ================= TYPES ================= */

interface Client {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  insurance_company: string;
  tpa: string;
  insurance_type: string;
  contract_date: string;
  policy_number: string;

  // optional / custom columns
  "Account manger"?: string;
  "Number of Insured"?: string;
  "Card Type"?: string;
  "Bank Account"?: string;
}

/* ================= COMPONENT ================= */

export default function Profile() {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single<Client>();

      if (error) {
        console.error("Error loading client:", error);
      } else {
        setClient(data);
      }

      setLoading(false);
    };

    fetchClient();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg text-red-500">Client profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-blue-600">
            {client.company_name?.charAt(0).toUpperCase() || "C"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {client.company_name}
            </h1>
            <p className="text-blue-100">{client.contact_person}</p>
            <p className="text-blue-100 text-sm">{client.email}</p>
          </div>
        </div>

        {/* Info */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileField label="Phone" value={client.phone} />
          <ProfileField label="Address" value={client.address} />
          <ProfileField
            label="Insurance Company"
            value={client.insurance_company}
          />
          <ProfileField label="TPA" value={client.tpa} />
          <ProfileField
            label="Insurance Type"
            value={client.insurance_type}
          />
          <ProfileField
            label="Account Manager"
            value={client["Account manger"]}
          />
          <ProfileField
            label="Contract Date"
            value={client.contract_date}
          />
          <ProfileField
            label="Policy Number"
            value={client.policy_number}
          />
          <ProfileField
            label="Number of Insured"
            value={client["Number of Insured"]}
          />
          <ProfileField
            label="Card Type"
            value={client["Card Type"]}
          />
          <ProfileField
            label="Bank Account"
            value={client["Bank Account"]}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER ================= */

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-xs uppercase text-gray-500 font-semibold">{label}</p>
      <p className="text-gray-800 text-sm mt-1">{value || "—"}</p>
    </div>
  );
}
