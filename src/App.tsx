import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RouterProvider, useRouter } from '@/router/Router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { EmployeeAttendance } from '@/pages/employee/EmployeeAttendance';
import { EmployeeLeave } from '@/pages/employee/EmployeeLeave';
import { EmployeePayroll } from '@/pages/employee/EmployeePayroll';
import { EmployeeProfile } from '@/pages/employee/EmployeeProfile';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminEmployees } from '@/pages/admin/AdminEmployees';
import { AdminAttendance } from '@/pages/admin/AdminAttendance';
import { AdminLeaves } from '@/pages/admin/AdminLeaves';
import { AdminPayroll } from '@/pages/admin/AdminPayroll';
import { useEffect } from 'react';

function AppRoutes() {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();

  const employeeRoutes: Record<string, React.ReactNode> = {
    '/employee/dashboard': <EmployeeDashboard />,
    '/employee/profile': <EmployeeProfile />,
    '/employee/attendance': <EmployeeAttendance />,
    '/employee/leave': <EmployeeLeave />,
    '/employee/payroll': <EmployeePayroll />,
  };

  const adminRoutes: Record<string, React.ReactNode> = {
    '/admin/dashboard': <AdminDashboard />,
    '/admin/employees': <AdminEmployees />,
    '/admin/attendance': <AdminAttendance />,
    '/admin/leaves': <AdminLeaves />,
    '/admin/payroll': <AdminPayroll />,
  };

  // Redirect root and unknown paths to the appropriate dashboard or login.
  // Moved into useEffect — never call navigate() during render.
  useEffect(() => {
    if (loading) return;
    if (path === '/' && user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    }
    const isKnown =
      path === '/login' ||
      path === '/register' ||
      path in employeeRoutes ||
      path in adminRoutes;
    if (!isKnown) {
      if (user) {
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [path, user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (path === '/login') return <LoginPage />;
  if (path === '/register') return <RegisterPage />;

  if (employeeRoutes[path]) {
    return (
      <ProtectedRoute>
        <Layout>{employeeRoutes[path]}</Layout>
      </ProtectedRoute>
    );
  }

  if (adminRoutes[path]) {
    return (
      <ProtectedRoute requireAdmin>
        <Layout>{adminRoutes[path]}</Layout>
      </ProtectedRoute>
    );
  }

  // While the useEffect redirect is pending, show a spinner instead of
  // calling navigate() during render.
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppRoutes />
      </RouterProvider>
    </AuthProvider>
  );
}
