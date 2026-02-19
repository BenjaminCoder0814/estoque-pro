// Componente para proteger rotas por perfil
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowed }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowed && !allowed.includes(user.perfil)) return <Navigate to="/login" />;
  return children;
}
