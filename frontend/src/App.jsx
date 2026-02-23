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
import Entrada from './pages/Entrada';
import Pendentes from './pages/Pendentes';
import Sugestoes from './pages/Sugestoes';
import Precos from './pages/Precos';
import Midia from './pages/Midia';
import Separacoes from './pages/Separacoes';
import Chat from './pages/Chat';

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

        {/* Dashboard — ADMIN somente */}
        <Route path="/" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><Dashboard /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Produtos — todos os perfis */}
        <Route path="/produtos" element={
          <PrivateRoute>
            <LayoutBase><Produtos /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Histórico — ADMIN, EXPEDICAO, SUPERVISAO apenas */}
        <Route path="/movimentacoes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'SUPERVISAO']}>
            <LayoutBase><Movimentacoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Alertas — ADMIN, COMPRAS (EXPEDICAO e SUPERVISAO não vêem) */}
        <Route path="/alertas" element={
          <PrivateRoute allowed={['ADMIN', 'COMPRAS']}>
            <LayoutBase><Alertas /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Pendentes — ADMIN, EXPEDICAO, COMPRAS */}
        <Route path="/pendentes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'COMPRAS']}>
            <LayoutBase><Pendentes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Auditoria — ADMIN apenas */}
        <Route path="/auditoria" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><Auditoria /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Entrada — ADMIN + EXPEDICAO (acessível via link dos Pendentes) */}
        <Route path="/entrada" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO']}>
            <LayoutBase><Entrada /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Sugestões — ADMIN apenas */}
        <Route path="/sugestoes" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><Sugestoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Usuários — ADMIN apenas */}
        <Route path="/usuarios" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><GerenciarUsuarios /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Preços — ADMIN, SUPERVISAO, COMERCIAL (catálogo comercial) */}
        <Route path="/precos" element={
          <PrivateRoute allowed={['ADMIN', 'SUPERVISAO', 'COMERCIAL']}>
            <LayoutBase><Precos /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Mídia — todos os perfis */}
        <Route path="/midia" element={
          <PrivateRoute>
            <LayoutBase><Midia /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Separações — ADMIN, EXPEDICAO, COMERCIAL, SUPERVISAO */}
        <Route path="/separacoes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'COMERCIAL', 'SUPERVISAO']}>
            <LayoutBase><Separacoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Chat — todos os perfis logados */}
        <Route path="/chat" element={
          <PrivateRoute>
            <LayoutBase><Chat /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Redireciona root para /produtos se não tem acesso ao dashboard */}
        <Route path="*" element={<Navigate to="/produtos" replace />} />
      </Routes>
    </AuthProvider>
  );
}
