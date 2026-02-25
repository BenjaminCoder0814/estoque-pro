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
import Cubagem from './pages/Cubagem';

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

        {/* Histórico — ADMIN, EXPEDICAO, SUPERVISAO, PRODUCAO */}
        <Route path="/movimentacoes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'SUPERVISAO', 'PRODUCAO']}>
            <LayoutBase><Movimentacoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Alertas — ADMIN, COMPRAS, EXPEDICAO, PRODUCAO */}
        <Route path="/alertas" element={
          <PrivateRoute allowed={['ADMIN', 'COMPRAS', 'EXPEDICAO', 'PRODUCAO']}>
            <LayoutBase><Alertas /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Pendentes — ADMIN, EXPEDICAO, COMPRAS, PRODUCAO */}
        <Route path="/pendentes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'COMPRAS', 'PRODUCAO']}>
            <LayoutBase><Pendentes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Auditoria — ADMIN apenas */}
        <Route path="/auditoria" element={
          <PrivateRoute allowed={['ADMIN']}>
            <LayoutBase><Auditoria /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Entrada — ADMIN + EXPEDICAO + PRODUCAO */}
        <Route path="/entrada" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'PRODUCAO']}>
            <LayoutBase><Entrada /></LayoutBase>
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

        {/* Preços — ADMIN, SUPERVISAO, COMERCIAL, COMPRAS */}
        <Route path="/precos" element={
          <PrivateRoute allowed={['ADMIN', 'SUPERVISAO', 'COMERCIAL', 'COMPRAS']}>
            <LayoutBase><Precos /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Mídia — ADMIN, SUPERVISAO, COMERCIAL */}
        <Route path="/midia" element={
          <PrivateRoute allowed={['ADMIN', 'SUPERVISAO', 'COMERCIAL']}>
            <LayoutBase><Midia /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Separações — ADMIN, EXPEDICAO, COMERCIAL, SUPERVISAO, PRODUCAO */}
        <Route path="/separacoes" element={
          <PrivateRoute allowed={['ADMIN', 'EXPEDICAO', 'COMERCIAL', 'SUPERVISAO', 'PRODUCAO']}>
            <LayoutBase><Separacoes /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Cubagem — ADMIN, SUPERVISAO, COMERCIAL */}
        <Route path="/cubagem" element={
          <PrivateRoute allowed={['ADMIN', 'SUPERVISAO', 'COMERCIAL']}>
            <LayoutBase><Cubagem /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Chat — todos os perfis logados */}
        <Route path="/chat" element={
          <PrivateRoute>
            <LayoutBase noPadding><Chat /></LayoutBase>
          </PrivateRoute>
        } />

        {/* Redireciona root para /produtos se não tem acesso ao dashboard */}
        <Route path="*" element={<Navigate to="/produtos" replace />} />
      </Routes>
    </AuthProvider>
  );
}
