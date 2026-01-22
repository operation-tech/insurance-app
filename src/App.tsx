import { Routes, Route } from "react-router-dom";

// Guards
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ClientRoute from "./components/ClientRoute";


// Layouts
import InternalLayout from "./layouts/InternalLayout";
import ClientLayout from "./layouts/ClientLayout";

// Public
import Welcome from "./Welcome";
import BrokerLogin from "./pages/internal/Login";
import ClientLogin from "./pages/client/ClientLogin";

// Internal Pages
import BrokerDashboard from "./pages/internal/BrokerDashboard";
import Clients from "./pages/internal/Clients";
import AddClient from "./pages/internal/AddClient";
import Requests from "./pages/internal/Requests";
import ClientProfile from "./pages/internal/ClientProfile";

// Client Pages
import ClientDashboard from "./pages/client/Dashboard";
import SubmitRequest from "./pages/client/SubmitRequest";
import MyRequests from "./pages/client/MyRequests";
import RequestDetails from "./pages/client/RequestDetails";
import Addition from "./pages/client/Addition";
import Deletion from "./pages/client/Deletion";
import Modification from "./pages/client/modification";
import Profile from "./pages/client/Profile";
import ActiveList from "./pages/client/ActiveList";

export default function App() {
  return (
    <Routes>

      {/* ---------- PUBLIC ---------- */}
      <Route path="/" element={<Welcome />} />
      <Route path="/internal/login" element={<BrokerLogin />} />
      <Route path="/client/login" element={<ClientLogin />} />

      {/* ---------- INTERNAL SYSTEM (ADMIN) ---------- */}
      <Route
        path="/internal"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <InternalLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<BrokerDashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/add" element={<AddClient />} />
        <Route path="clients/profile/:id" element={<ClientProfile />} />
        <Route path="requests" element={<Requests />} />
      </Route>

      {/* ---------- CLIENT PORTAL ---------- */}
      <Route
        path="/client"
        element={
          <ProtectedRoute>
            <ClientRoute>
              <ClientLayout />
            </ClientRoute>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ClientDashboard />} />
        <Route path="submit-request" element={<SubmitRequest />} />
        <Route path="my-requests" element={<MyRequests />} />
        <Route path="request/:id" element={<RequestDetails />} />
        <Route path="addition" element={<Addition />} />
        <Route path="deletion" element={<Deletion />} />
        <Route path="modification" element={<Modification />} />
        <Route path="profile" element={<Profile />} />
        <Route path="active-list" element={<ActiveList />} />
      </Route>

    </Routes>
  );
}
