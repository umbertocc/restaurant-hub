
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function SuperadminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, ruoli } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!ruoli.includes('superadmin')) return <Navigate to="/" replace />;
  return <>{children}</>;
}
