// Topbar com gradiente profissional
import React, { useState, useRef, useEffect } from 'react';
import { LucideLogOut, LucideBell, LucideAlertTriangle, LucideX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { alertas } = useEstoque();
  const [alertaAberto, setAlertaAberto] = useState(false);
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
        <div className="bg-white/20 rounded-xl p-1.5 backdrop-blur-sm">
          <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain drop-shadow-md" />
        </div>
        <span className="font-extrabold text-xl text-white tracking-wider hidden sm:inline drop-shadow">ZENITH</span>
      </div>

      {/* Ações direita */}
      <div className="flex items-center gap-3">
        {/* Sino de alertas */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAlertaAberto(v => !v)}
            className="relative p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-all"
            title={alertas.length > 0 ? `${alertas.length} alerta(s) de estoque` : 'Sem alertas'}
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
        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradiente} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
            {user?.nome?.charAt(0)?.toUpperCase()}
          </div>
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-white text-sm leading-tight">{user?.nome}</div>
            <div className="text-[10px] text-white/70 uppercase tracking-widest">{user?.perfil}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-xl bg-white/15 hover:bg-red-500/80 text-white transition-all duration-200 backdrop-blur-sm group"
          aria-label="Sair"
          title="Sair do sistema"
        >
          <LucideLogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </header>
  );
}
