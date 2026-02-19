// Sidebar corporativa com gradiente escuro profissional
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LucideLayoutDashboard, LucideBox, LucideList, LucidePackageCheck,
  LucideUsers, LucideChevronLeft, LucideChevronRight,
  LucideAlertTriangle, LucideUserCog, LucideClipboardList, LucideLightbulb,
  LucideClipboard, LucideTag, LucideImage
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';

// Cada item tem `allowed` listando os perfis que PODEM ver
// Se `allowed` é undefined → todos os perfis logados veem
const menu = [
  // ADMIN: tudo
  { label: 'Dashboard',  icon: LucideLayoutDashboard, to: '/',             allowed: ['ADMIN'] },
  // Todos veem Produtos
  { label: 'Produtos',   icon: LucideBox,              to: '/produtos'      },
  // Todos veem Preços
  { label: 'Preços',     icon: LucideTag,              to: '/precos'        },
  // ADMIN + EXPEDICAO + SUPERVISAO
  { label: 'Histórico',  icon: LucideList,             to: '/movimentacoes', allowed: ['ADMIN', 'EXPEDICAO', 'SUPERVISAO'] },
  // ADMIN + COMPRAS (não EXPEDICAO, não SUPERVISAO)
  { label: 'Alertas',    icon: LucideAlertTriangle,    to: '/alertas',       allowed: ['ADMIN', 'COMPRAS'] },
  // ADMIN + EXPEDICAO + COMPRAS
  { label: 'Pendentes',  icon: LucideClipboard,        to: '/pendentes',     allowed: ['ADMIN', 'EXPEDICAO', 'COMPRAS'] },
  // ADMIN só (EXPEDICAO acessa via link de Pendentes)
  { label: 'Entrada',    icon: LucidePackageCheck,     to: '/entrada',       allowed: ['ADMIN'] },
  // ADMIN só
  { label: 'Auditoria',  icon: LucideClipboardList,    to: '/auditoria',     allowed: ['ADMIN'] },
  { label: 'Sugestões',  icon: LucideLightbulb,        to: '/sugestoes',     allowed: ['ADMIN'] },
  { label: 'Usuários',   icon: LucideUserCog,          to: '/usuarios',      allowed: ['ADMIN'] },
  // Todos veem Mídia
  { label: 'Mídia',      icon: LucideImage,            to: '/midia'          },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { alertas } = useEstoque();
  const location = useLocation();

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 shadow-sidebar relative z-10 ${collapsed ? 'w-20' : 'w-64'}`}
      style={{
        minWidth: collapsed ? 80 : 256,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
      }}
    >
      {/* Logo + nome */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-extrabold text-white text-base tracking-widest">ZENITH</div>
            <div className="text-[10px] text-indigo-300 tracking-widest uppercase">Estoque Pro</div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menu
          .filter(item => !item.allowed || item.allowed.includes(user?.perfil))
          .map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm
                  ${active
                    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/20 text-white border border-indigo-500/40 shadow-glow'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {/* linha ativa */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-indigo-300' : 'group-hover:text-indigo-300'}`} />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.label}
                    {item.to === '/alertas' && alertas.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow">
                        {alertas.length}
                      </span>
                    )}
                  </span>
                )}
                {collapsed && item.to === '/alertas' && alertas.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                    {alertas.length}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Colapso */}
      <button
        className="mx-auto mb-3 p-2 rounded-xl bg-white/10 hover:bg-indigo-500/30 text-slate-400 hover:text-white transition-all"
        onClick={() => setCollapsed(c => !c)}
        aria-label="Colapsar sidebar"
      >
        {collapsed ? <LucideChevronRight className="w-4 h-4" /> : <LucideChevronLeft className="w-4 h-4" />}
      </button>

      {/* Usuário logado */}
      <div className="border-t border-white/10 px-3 py-3">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
              {user?.nome?.charAt(0)?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{user?.nome}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">{user?.perfil}</div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/15 px-2 py-1.5 rounded-lg transition-all text-left"
        >
          {collapsed ? '⏏' : '✕  Sair do sistema'}
        </button>
      </div>

      <div className="text-[10px] text-slate-600 text-center pb-2 tracking-widest">v2.1</div>
    </aside>
  );
}
