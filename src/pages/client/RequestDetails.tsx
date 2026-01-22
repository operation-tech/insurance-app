import { useParams } from "react-router-dom";
import ClientNavbar from "../../components/ClientNavbar";

const RequestDetails = () => {
  const { id } = useParams();

  // Later: fetch request details from Supabase using `id`

  return (
    <div>
      <ClientNavbar />
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Request Details</h2>
        <p><strong>ID:</strong> {id}</p>
        <p><strong>Type:</strong> Claim</p>
        <p><strong>Status:</strong> Pending</p>
        <p><strong>Description:</strong> Sample description of the request.</p>
      </div>
    </div>
  );
};

export default RequestDetails;
