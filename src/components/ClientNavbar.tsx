import { Link } from "react-router-dom";

const ClientNavbar = () => {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <div className="text-xl font-semibold">Client Portal</div>
      <div className="space-x-4">
        <Link to="/client/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
        <Link to="/client/request" className="text-blue-600 hover:underline">Submit Request</Link>
        <Link to="/client/my-requests" className="text-blue-600 hover:underline">My Requests</Link>
        <Link to="/client/login" className="text-red-500 hover:underline">Logout</Link>
      </div>
    </nav>
  );
};

export default ClientNavbar;
