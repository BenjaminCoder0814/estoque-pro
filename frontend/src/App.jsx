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
import Relatorios from './pages/Relatorios';
import Alertas from './pages/Alertas';
import GerenciarUsuarios from './pages/GerenciarUsuarios';

function PrivateRoute({ children, allowed }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowed && !allowed.includes(user.perfil)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <LayoutBase><Dashboard /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="/produtos" element={
          <PrivateRoute>
            <LayoutBase><Produtos /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="/movimentacoes" element={
          <PrivateRoute>
            <LayoutBase><Movimentacoes /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="/alertas" element={
          <PrivateRoute>
            <LayoutBase><Alertas /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="/auditoria" element={
          <PrivateRoute allowed={['ADMIN', 'GERENCIA']}>
            <LayoutBase><Auditoria /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="/relatorios" element={
          <PrivateRoute allowed={['ADMIN', 'GERENCIA']}>
            <LayoutBase><Relatorios /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="/usuarios" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><GerenciarUsuarios /></LayoutBase>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
