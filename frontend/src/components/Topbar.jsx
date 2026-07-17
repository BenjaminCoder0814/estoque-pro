// Topbar com gradiente profissional
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LucideLogOut, LucideBell, LucideAlertTriangle, LucideX, LucidePencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';
import EditDisplayNameModal from './EditDisplayNameModal';
import { aplicarOverrideDisplay } from '../pages/chat/chatHelpers';

export default function Topbar() {
  const { user: userReal, logout } = useAuth();
  const user = useMemo(() => aplicarOverrideDisplay(userReal), [userReal]);
  const { alertas, syncStatus } = useEstoque();
  const [alertaAberto, setAlertaAberto] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAlertaAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const perfilColors = {
    ADMIN:      'from-indigo-500 to-purple-600',
    GERENCIA:   'from-blue-500 to-cyan-600',
    EXPEDICAO:  'from-emerald-500 to-teal-600',
    SUPERVISAO: 'from-violet-500 to-fuchsia-600',
    VENDEDORA:  'from-pink-500 to-rose-600',
  };
  const gradiente = perfilColors[user?.perfil] || 'from-indigo-500 to-purple-600';

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shadow-lg animate-gradient"
      style={{
        background: 'linear-gradient(90deg,#6366f1 0%,#8b5cf6 40%,#06b6d4 100%)',
        backgroundSize: '200% auto',
        animation: 'gradient-shift 8s ease infinite',
      }}
    >
      {/* Logo + nome */}
      <div className="flex items-center gap-3">
        <div className="bg-white/20 rounded-xl p-1.5 backdrop-blur-sm" title="Voltar para o painel principal do estoque Zenith" aria-label="Voltar para o painel principal do estoque Zenith">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-9 w-9 object-contain drop-shadow-md" />
        </div>
        <span className="font-extrabold text-xl text-white tracking-wider hidden sm:inline drop-shadow">ZENITH</span>
      </div>

      {/* Ações direita */}
      <div className="flex items-center gap-3">
        {/* Indicador "Ao vivo" — sync ativo com banco Neon */}
        <div
          className="hidden md:flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl px-2.5 py-1.5 backdrop-blur-sm transition cursor-default"
          title={!syncStatus?.ok
            ? 'Sem conexão com a API de estoque. Tentando reconectar...'
            : syncStatus?.degraded
              ? `Sincronização parcial: produtos em tempo real e histórico oscilando. Última verificação: ${syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : '—'}`
              : `Status: conectado ao banco de dados. Última sincronização: ${syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : '—'}`}
          aria-label={!syncStatus?.ok
            ? 'Sem conexão com a API de estoque. Tentando reconectar...'
            : syncStatus?.degraded
              ? `Sincronização parcial: produtos em tempo real e histórico oscilando. Última verificação: ${syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : '—'}`
              : `Status: conectado ao banco de dados. Última sincronização: ${syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : '—'}`}
        >
          <span className={`relative flex h-2 w-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${!syncStatus?.ok ? 'bg-red-400' : syncStatus?.degraded ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${!syncStatus?.ok ? 'bg-red-500' : syncStatus?.degraded ? 'bg-amber-500' : 'bg-emerald-400'}`}></span>
          </span>
          <span className="text-white text-[11px] font-semibold uppercase tracking-wider">
            {!syncStatus?.ok ? 'Offline' : syncStatus?.degraded ? 'Parcial' : 'Ao vivo'}
          </span>
        </div>

        {/* Sino de alertas */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAlertaAberto(v => !v)}
            className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-all"
            title={alertas.length > 0 ? `${alertas.length} alerta(s) de estoque: produtos abaixo do mínimo ou com problemas críticos.` : 'Sem alertas de estoque no momento.'}
            aria-label={alertas.length > 0 ? `${alertas.length} alerta(s) de estoque: produtos abaixo do mínimo ou com problemas críticos.` : 'Sem alertas de estoque no momento.'}
          >
            <LucideBell className="w-5 h-5" />
            {alertas.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                {alertas.length}
              </span>
            )}
          </button>

          {/* Dropdown de alertas */}
          {alertaAberto && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideup"
              style={{
                background: 'rgba(15,23,42,0.97)',
                border: '1px solid rgba(99,102,241,0.25)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <LucideAlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-bold text-sm">Alertas de Estoque</span>
                  {alertas.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{alertas.length}</span>
                  )}
                </div>
                <button onClick={() => setAlertaAberto(false)} className="text-slate-400 hover:text-white transition">
                  <LucideX className="w-4 h-4" />
                </button>
              </div>

              {/* Lista */}
              <div className="max-h-80 overflow-y-auto">
                {alertas.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    ✅ Nenhum produto com estoque crítico
                  </div>
                ) : (
                  alertas.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{p.nome}</div>
                        <div className="text-slate-400 text-[11px]">{p.categoria}</div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-red-400 font-extrabold text-base leading-none">{p.estoqueAtual}</div>
                        <div className="text-slate-500 text-[10px]">mín: {p.estoqueMinimo}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {alertas.length > 0 && (
                <div className="px-4 py-2.5 text-[11px] text-slate-500 text-center border-t border-white/10">
                  Produtos com estoque abaixo do mínimo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usuário */}
        <button
          type="button"
          onClick={() => setEditProfileOpen(true)}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-1.5 backdrop-blur-sm transition group"
          title="Editar meu nome e foto de perfil"
        >
          <div className={`relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br ${gradiente} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <span>{user?.nome?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-white text-sm leading-tight flex items-center gap-1 justify-end">
              {user?.nome}
              <LucidePencil className="w-3 h-3 opacity-70 group-hover:opacity-100" />
            </div>
            <div className="text-[10px] text-white/70 uppercase tracking-widest">{user?.perfil}</div>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-xl bg-white/15 hover:bg-red-500/80 text-white transition-all duration-200 backdrop-blur-sm group"
          aria-label="Sair do sistema e encerrar sessão de usuário."
          title="Sair do sistema e encerrar sessão de usuário."
        >
          <LucideLogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      <EditDisplayNameModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
    </header>
  );
}
