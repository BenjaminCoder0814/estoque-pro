// App.jsx — Roteamento principal 100% frontend
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LayoutBase from './components/LayoutBase';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Movimentacoes from './pages/Movimentacoes';
import Auditoria from './pages/Auditoria';
import Alertas from './pages/Alertas';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import Compras from './pages/Compras';
import Sugestoes from './pages/Sugestoes';

function PrivateRoute({ children, allowed }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowed && !allowed.includes(user.perfil)) return <Navigate to="/produtos" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard — ADMIN e SUPERVISAO */}
        <Route path="/" element={
          <PrivateRoute allowed={['ADMIN', 'SUPERVISAO']}>
            <LayoutBase><Dashboard /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Produtos — todos os perfis */}
        <Route path="/produtos" element={
          <PrivateRoute>
            <LayoutBase><Produtos /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Histórico — ADMIN, EXPEDICAO, COMPRAS, SUPERVISAO */}
        <Route path="/movimentacoes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'COMPRAS', 'SUPERVISAO']}>
            <LayoutBase><Movimentacoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Alertas — ADMIN, EXPEDICAO, SUPERVISAO */}
        <Route path="/alertas" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'SUPERVISAO']}>
            <LayoutBase><Alertas /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Auditoria — ADMIN apenas */}
        <Route path="/auditoria" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><Auditoria /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Compras — ADMIN, EXPEDICAO, COMPRAS */}
        <Route path="/compras" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'COMPRAS']}>
            <LayoutBase><Compras /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Sugestões — todos os perfis */}
        <Route path="/sugestoes" element={
          <PrivateRoute>
            <LayoutBase><Sugestoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Usuários — ADMIN apenas */}
        <Route path="/usuarios" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><GerenciarUsuarios /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Redireciona root para /produtos se não tem acesso ao dashboard */}
        <Route path="*" element={<Navigate to="/produtos" replace />} />
      </Routes>
    </AuthProvider>
  );
}
