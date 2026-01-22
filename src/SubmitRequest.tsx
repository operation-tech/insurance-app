import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useNavigate } from 'react-router-dom';

const SubmitRequest = () => {
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    request_type: '',
    details: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        navigate('/client/login');
      }
    };

    fetchUser();
  }, [navigate]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let attachmentUrl = '';

    // Upload file if selected
    if (file) {
      const fileName = `${userId}-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('client-attachments')
        .upload(fileName, file);

      if (error) {
        alert('File upload failed: ' + error.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('client-attachments')
        .getPublicUrl(fileName);

      attachmentUrl = publicUrlData.publicUrl;
    }

    // Insert request into table
    const { error } = await supabase.from('requests').insert({
      ...formData,
      client_id: userId,
      attachment_url: attachmentUrl,
      status: 'Pending',
      created_at: new Date(),
    });

    if (error) {
      alert('Error submitting request: ' + error.message);
    } else {
      alert('Request submitted!');
      navigate('/client/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow-md rounded w-full max-w-lg space-y-4">
        <h2 className="text-2xl font-bold text-center">Submit Request</h2>

        <select
          name="request_type"
          className="input"
          required
          onChange={handleChange}
        >
          <option value="">Select Request Type</option>
          <option value="Card Issue">Card Issue</option>
          <option value="Reimbursement">Reimbursement</option>
          <option value="Network Inquiry">Network Inquiry</option>
          <option value="Other">Other</option>
        </select>

        <textarea
          name="details"
          placeholder="Details about the request"
          className="input h-32"
          onChange={handleChange}
          required
        />

        <input
          type="file"
          onChange={handleFileChange}
          className="input"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default SubmitRequest;
