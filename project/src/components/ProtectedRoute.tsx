import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/router/Router';
import { Spinner } from '@/components/ui';
import { useEffect } from 'react';

export function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (requireAdmin && user.role !== 'admin') {
        navigate('/employee/dashboard');
      }
    }
  }, [user, loading, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && user.role !== 'admin') return null;

  return <>{children}</>;
}
