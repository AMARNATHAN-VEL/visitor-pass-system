import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
// Receptionist pages
import RegisterVisitor from "./pages/receptionist/RegisterVisitor";
import CheckInOut from "./pages/receptionist/CheckInOut";
// Employee pages
import PendingRequests from "./pages/employee/PendingRequests";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import Reports from "./pages/admin/Reports";
import ActivityLogs from "./pages/admin/ActivityLogs";

const ROLE_HOME = {
  Admin: "/admin/dashboard",
  Receptionist: "/receptionist/register-visitor",
  Employee: "/employee/pending-requests",
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Role-based home redirects */}
        <Route path="/" element={<RoleHome />} />

        {/* Receptionist routes */}
        <Route
          path="/receptionist/register-visitor"
          element={
            <ProtectedRoute allowedRoles={["Receptionist"]}>
              <RegisterVisitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receptionist/check-in-out"
          element={
            <ProtectedRoute allowedRoles={["Receptionist"]}>
              <CheckInOut />
            </ProtectedRoute>
          }
        />

        {/* Employee routes */}
        <Route
          path="/employee/pending-requests"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <PendingRequests />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Receptionist", "Employee"]}
            >
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity-logs"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/**
 * Redirects an authenticated user to their role's home page.
 */
function RoleHome() {
  const { user } = useAuth();
  const home = ROLE_HOME[user?.role] || "/login";
  return <Navigate to={home} replace />;
}

export default App;
