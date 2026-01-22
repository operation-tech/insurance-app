import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/lib/supabase";
import InternalLayout from "@/layouts/InternalLayout";


function ClientForm() {
  const [formData, setFormData] = useState({
    client_name: '',
    hr_name: '',
    hr_email: '',
    client_address: '',
    type_of_insured: '',
    account_mang: '',
    insurance_con: '',
    tpa_company: '',
    contract_date: '',
    insurance_type: '',
  });

  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form:', formData);

    const { error } = await supabase.from('clients').insert([
      {
        'Client Name': formData.client_name,
        'HR Name': formData.hr_name,
        'HR Email': formData.hr_email,
        'Client Address': formData.client_address,
        'Type of insured': formData.type_of_insured,
        'Account Manger': formData.account_mang,
        'Insurance Company': formData.insurance_con,
        'TPA Company': formData.tpa_company,
        'Contract Date': formData.contract_date,
        'Insurance Type': formData.insurance_type,
      },
    ]);

    if (error) {
      console.error('Insert error:', error.message, error.details);
      alert('Failed to add client: ' + error.message);
    } else {
      alert('Client added successfully!');
      navigate('/');
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Add New Client</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          name="client_name"
          placeholder="Client Name"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          name="hr_name"
          placeholder="HR Name"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          name="hr_email"
          placeholder="HR Email"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          name="client_address"
          placeholder="Client Address"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <select
          name="type_of_insured"
          onChange={handleChange}
          className="w-full p-2 border"
        >
          <option value="">Select Type of Insured</option>
          <option value="Individual">Individual</option>
          <option value="Corporate">Corporate</option>
        </select>
        <input
          name="account_mang"
          placeholder="Account Manager"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          name="insurance_con"
          placeholder="Insurance Company"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          name="tpa_company"
          placeholder="TPA Company"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          name="contract_date"
          type="date"
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <select
          name="insurance_type"
          onChange={handleChange}
          className="w-full p-2 border"
        >
          <option value="">Select Insurance Type</option>
          <option value="Medical">Medical</option>
          <option value="Life">Life</option>
          <option value="Motor">Motor</option>
          <option value="Property">Property</option>
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </>
  );
}

export default ClientForm;
