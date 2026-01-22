// src/pages/internal/AddClient.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddClient() {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.from("clients").insert([formData]);

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      alert("✅ Client added successfully!");
      setFormData({});
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-jadwa mb-6">Add New Client</h2>

      {error && (
        <div className="bg-red-100 text-red-600 border border-red-300 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* CLIENT DATA */}
        <FormSection title="Client Data">
          <TwoColInput name="company_name" placeholder="Company Name" onChange={handleChange} />
          <TwoColInput name="insurance_company" placeholder="Insurance Company" onChange={handleChange} />
          <TwoColInput name="contact_person" placeholder="HR Name" onChange={handleChange} />
          <TwoColInput name="tpa_company" placeholder="TPA Company" onChange={handleChange} />
          <TwoColInput name="email" placeholder="HR Email" onChange={handleChange} />
          <TwoColInput name="contract_date" type="date" placeholder="Contract Date" onChange={handleChange} />
          <TwoColInput name="address" placeholder="Client Address" onChange={handleChange} />
          <TwoColInput name="insurance_type" placeholder="Insurance Type" onChange={handleChange} />
          <TwoColInput name="type_of_insured" placeholder="Type of Insured" onChange={handleChange} />
          <TwoColInput name="account_manager" placeholder="Account Manager" onChange={handleChange} />
        </FormSection>

        {/* INSURANCE COMPANY - PRODUCTION */}
        <FormSection title="Insurance Company - Production">
          <TwoColInput name="production_email" placeholder="Production Email" onChange={handleChange} />
          <TwoColInput name="production_sla" placeholder="Production SLA" onChange={handleChange} />
          <TwoColSelect
            name="card_type"
            onChange={handleChange}
            options={["Physical", "Digital"]}
            placeholder="Select Card Type"
          />
          <TwoColRadioGroup name="photo_required" label="Photo Required" onChange={handleChange} />
          <TwoColInput name="destructed_card" placeholder="Destructed Card" onChange={handleChange} />
          <TwoColInput name="escalation_to" placeholder="Escalation To" onChange={handleChange} />
        </FormSection>

        {/* REFUND */}
        <FormSection title="Refund">
          <TwoColInput name="refund_channel" placeholder="Refund Channel" onChange={handleChange} />
          <TwoColInput name="refund_email" placeholder="Mail" onChange={handleChange} />
          <TwoColInput name="refund_sla" placeholder="Refund SLA" onChange={handleChange} />
          <TwoColInput name="refund_type" placeholder="Refund Type" onChange={handleChange} />
        </FormSection>

        {/* APPROVAL */}
        <FormSection title="Approval">
          <TwoColInput name="approval_email" placeholder="Approval Email" onChange={handleChange} />
          <TwoColInput name="approval_sla" placeholder="Approval SLA" onChange={handleChange} />
        </FormSection>

        {/* CHRONIC */}
        <FormSection title="Chronic">
          <TwoColInput name="chronic_email" placeholder="Chronic Email" onChange={handleChange} />
          <TwoColInput name="chronic_sla" placeholder="Chronic SLA" onChange={handleChange} />
        </FormSection>

        <button
          type="submit"
          disabled={loading}
          className="bg-jadwa text-white px-6 py-2 rounded-lg hover:bg-[#1f6b82]"
        >
          {loading ? "Saving..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------
   REUSABLE COMPONENTS
-------------------------------------------- */

const FormSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-gray-50 p-6 rounded-lg shadow">
    <h3 className="text-xl font-semibold mb-4 text-jadwa">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </section>
);

const TwoColInput = ({
  name,
  placeholder,
  type = "text",
  onChange,
}: any) => (
  <input
    name={name}
    type={type}
    placeholder={placeholder}
    onChange={onChange}
    className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jadwa"
  />
);

const TwoColSelect = ({ name, placeholder, options, onChange }: any) => (
  <select
    name={name}
    onChange={onChange}
    className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-jadwa"
  >
    <option value="">{placeholder}</option>
    {options.map((opt: string) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

const TwoColRadioGroup = ({ name, label, onChange }: any) => (
  <div className="flex items-center space-x-4">
    <span className="text-sm font-medium">{label}:</span>
    <label>
      <input type="radio" name={name} value="Yes" onChange={onChange} /> Yes
    </label>
    <label>
      <input type="radio" name={name} value="No" onChange={onChange} /> No
    </label>
  </div>
);
