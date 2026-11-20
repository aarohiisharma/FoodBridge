import { Navigate, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

/**
 * Root application component.
 *
 * Defines all routes and wraps protected pages in <ProtectedRoute>.
 * Public pages use MainLayout (Navbar + Footer).
 * Dashboard pages use DashboardLayout (Navbar + Sidebar).
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Public routes ── */}
      <Route element={<MainLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ── Protected dashboard routes ── */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard/donor"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ngo"
          element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <NgoDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/volunteer"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ── Catch-all ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
