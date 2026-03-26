import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, RoleRoute, GuestRoute } from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Tasks from './pages/tasks/Tasks';
import Progress from './pages/tasks/Progress';
import Alerts from './pages/tasks/Alerts';
import Analytics from './pages/analytics/Analytics';
import Users from './pages/users/Users';
import Reports from './pages/reports/Reports';
import Automation from './pages/automation/Automation';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            {/* Guest routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/analytics" element={<Analytics />} />

                {/* HR + Admin */}
                <Route element={<RoleRoute allowedRoles={['hr', 'admin']} />}>
                  <Route path="/users" element={<Users />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

                {/* Admin only */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path="/automation" element={<Automation />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
