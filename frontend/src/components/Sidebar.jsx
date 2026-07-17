// Sidebar corporativa com gradiente escuro profissional
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LucideLayoutDashboard, LucideBox, LucideList, LucidePackageCheck,
  LucideUsers, LucideChevronLeft, LucideChevronRight,
  LucideAlertTriangle, LucideUserCog, LucideClipboardList, LucideLightbulb,
  LucideClipboard, LucideTag, LucideImage, LucideTruck, LucideMessageSquare, LucideRuler,
  LucidePhone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { aplicarOverrideDisplay } from '../pages/chat/chatHelpers';
import { useEstoque } from '../contexts/EstoqueContext';
import EditDisplayNameModal from './EditDisplayNameModal';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CHAT_COL, saveConversas } from '../pages/chat/chatHelpers';
import { aplicarOverridePerfil } from '../pages/chat/chatHelpers';

// Cada item tem `allowed` listando os perfis que PODEM ver
// Se `allowed` é undefined → todos os perfis logados veem
const menu = [
  { label: 'Dashboard',  icon: LucideLayoutDashboard, to: '/',             allowed: ['ADMIN', 'VISITANTE'],
    desc: 'Painel geral do estoque: KPIs, alertas críticos e movimentações em tempo real.' },
  { label: 'Produtos',   icon: LucideBox,              to: '/produtos',
    desc: 'Catálogo completo de produtos disponíveis no estoque Zenith.' },
  { label: 'Preços',     icon: LucideTag,              to: '/precos',        allowed: ['ADMIN', 'SUPERVISAO', 'COMERCIAL', 'COMPRAS', 'VISITANTE'],
    desc: 'Tabela de preços por categoria: atacado, varejo e unidade.' },
  { label: 'Histórico',  icon: LucideList,             to: '/movimentacoes', allowed: ['ADMIN', 'EXPEDICAO', 'SUPERVISAO', 'PRODUCAO', 'VISITANTE'],
    desc: 'Histórico completo de entradas e saídas do estoque.' },
  { label: 'Alertas',    icon: LucideAlertTriangle,    to: '/alertas',       allowed: ['ADMIN', 'COMPRAS', 'EXPEDICAO', 'PRODUCAO', 'VISITANTE'],
    desc: 'Produtos abaixo do estoque mínimo e alertas críticos.' },
  { label: 'Pendentes',  icon: LucideClipboard,        to: '/pendentes',     allowed: ['ADMIN', 'EXPEDICAO', 'COMPRAS', 'PRODUCAO', 'VISITANTE'],
    desc: 'Pedidos de compra aguardando aprovação ou entrega.' },
  { label: 'Entrada',    icon: LucidePackageCheck,     to: '/entrada',       allowed: ['ADMIN', 'EXPEDICAO', 'PRODUCAO', 'VISITANTE'],
    desc: 'Registrar novas entradas de produtos no estoque.' },
  { label: 'Auditoria',  icon: LucideClipboardList,    to: '/auditoria',     allowed: ['ADMIN', 'VISITANTE'],
    desc: 'Logs completos de ações e histórico de preços.' },
  { label: 'Sugestões',  icon: LucideLightbulb,        to: '/sugestoes',
    desc: 'Canal para sugestões internas entre equipes.' },
  { label: 'Usuários',   icon: LucideUserCog,          to: '/usuarios',      allowed: ['ADMIN'],
    desc: 'Gestão de usuários e permissões de acesso.' },
  { label: 'Separações', icon: LucideTruck,             to: '/separacoes',    allowed: ['ADMIN', 'EXPEDICAO', 'COMERCIAL', 'SUPERVISAO', 'PRODUCAO', 'VISITANTE'],
    desc: 'Gestão de pedidos e separação de mercadorias (Kanban).' },
  { label: 'Mídia',      icon: LucideImage,            to: '/midia',         allowed: ['ADMIN', 'SUPERVISAO', 'COMERCIAL', 'VISITANTE'],
    desc: 'Galeria de fotos dos produtos organizados por categoria.' },
  { label: 'Cubagem',    icon: LucideRuler,            to: '/cubagem',       allowed: ['ADMIN', 'SUPERVISAO', 'COMERCIAL', 'EXPEDICAO', 'VISITANTE'],
    desc: 'Calculadora de cubagem para otimizar espaço em fretes.' },
  { label: 'Chat',       icon: LucideMessageSquare,   to: '/chat',          allowed: ['ADMIN', 'EXPEDICAO', 'COMPRAS', 'SUPERVISAO', 'COMERCIAL', 'PRODUCAO'],
    desc: 'Canal de comunicação interna entre equipes.' },
  { label: 'Ramais',     icon: LucidePhone,            to: '/ramais',
    desc: 'Lista compartilhada de ramais internos — edição liberada para todos.' },
  { label: 'Portaria',   icon: LucideClipboardList,    to: '/portaria',      allowed: ['ADMIN', 'EXPEDICAO', 'SUPERVISAO'],
    desc: 'Fila de atendimento da portaria via QR code para expedição.' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const { user: userReal, logout } = useAuth();
  const user = React.useMemo(() => aplicarOverrideDisplay(userReal), [userReal]);
  const { alertas } = useEstoque();
  const location = useLocation();

  // Contagem de mensagens não lidas no chat
  const [chatNaoLidas, setChatNaoLidas] = useState(0);
  const [chatRemetentes, setChatRemetentes] = useState([]); // [{nome, qtd}]

  // Subscrição GLOBAL do Firestore → mantém localStorage sempre fresco,
  // independente da página em que o usuário esteja.
  useEffect(() => {
    if (!user) return;
    const isAdmin = ['ADMIN', 'TI', 'DIRETORIA'].includes(user.perfil);
    const col = collection(db, 'chat_conversas');
    const q = isAdmin ? col : query(col, where('participantIds', 'array-contains', user.id));
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      try { saveConversas(convs); } catch {}
    }, () => {});
    return () => unsub();
  }, [user]);

  useEffect(() => {
    function calc() {
      if (!user) return { total: 0, remetentes: [] };
      try {
        const convs = JSON.parse(localStorage.getItem('zkChat') || '[]');
        const contatos = JSON.parse(localStorage.getItem('zkContatos') || '[]');
        const readMap = JSON.parse(localStorage.getItem('zkChatRead') || '{}');
        const userRead = readMap[user.id] || {};
        const porRemetente = new Map();
        let total = 0;
        convs
          .filter(c => Array.isArray(c.participantIds) && c.participantIds.includes(user.id))
          .forEach(c => {
            const visto = userRead[c.id] || 0;
            (c.messages || [])
              .filter(m =>
                m.de !== user.id &&
                m.em > visto &&
                !m.deletedForAll &&
                !(Array.isArray(m.deletedFor) && m.deletedFor.includes(user.id))
              )
              .forEach(m => {
                total += 1;
                const ctRaw = contatos.find(x => x.id === m.de);
                const ct = ctRaw ? aplicarOverridePerfil(ctRaw) : null;
                const nome = ct?.nome || m.deNome || 'Usuário';
                porRemetente.set(nome, (porRemetente.get(nome) || 0) + 1);
              });
          });
        const remetentes = [...porRemetente.entries()]
          .map(([nome, qtd]) => ({ nome, qtd }))
          .sort((a, b) => b.qtd - a.qtd);
        return { total, remetentes };
      } catch { return { total: 0, remetentes: [] }; }
    }
    function tick() {
      const { total, remetentes } = calc();
      setChatNaoLidas(total);
      setChatRemetentes(remetentes);
    }
    tick();
    const timer = setInterval(tick, 1000);
    const onStorage = () => tick();
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(timer); window.removeEventListener('storage', onStorage); };
  }, [user]);

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
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-7 h-7 object-contain" />
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
          .filter(item => {
            if (!item.allowed) return true;
            const perfil = user?.perfil;
            if (perfil === 'TI' || perfil === 'ADMIN' || perfil === 'DIRETORIA') return true;
            const perfilEfetivo = perfil === 'CENTRAL_ATENDIMENTO' ? 'SUPERVISAO' : perfil;
            return item.allowed.includes(perfilEfetivo);
          })
          .map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.desc}
                aria-label={item.desc}
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
                    {item.to === '/chat' && chatNaoLidas > 0 && (
                      <span
                        className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow animate-pulse"
                        title={chatRemetentes.map(r => `${r.nome}: ${r.qtd}`).join('\n')}
                      >
                        {chatNaoLidas}
                      </span>
                    )}
                  </span>
                )}
                {collapsed && item.to === '/alertas' && alertas.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                    {alertas.length}
                  </span>
                )}
                {collapsed && item.to === '/chat' && chatNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow animate-pulse">
                    {chatNaoLidas}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Mini-lista de mensagens não lidas: quem mandou + quantidade */}
      {!collapsed && chatNaoLidas > 0 && (
        <Link
          to="/chat"
          className="mx-3 mb-3 rounded-xl px-3 py-2.5 block border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition"
          title="Ir para o chat"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest">
              💬 Novas mensagens
            </span>
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow">
              {chatNaoLidas}
            </span>
          </div>
          <div className="space-y-0.5">
            {chatRemetentes.slice(0, 4).map(r => (
              <div key={r.nome} className="flex items-center justify-between text-[11px] text-white">
                <span className="truncate">{r.nome}</span>
                <span className="ml-2 text-red-200 font-semibold">{r.qtd}</span>
              </div>
            ))}
            {chatRemetentes.length > 4 && (
              <div className="text-[10px] text-red-200/80 italic">
                + {chatRemetentes.length - 4} pessoa(s)…
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Badge Modo Visitante */}
      {user?.perfil === 'VISITANTE' && !collapsed && (
        <div
          className="mx-3 mb-3 rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <span className="text-base">👁️</span>
          <div>
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Modo Visitante</div>
            <div className="text-[9px] text-slate-500 leading-tight">Somente visualização</div>
          </div>
        </div>
      )}

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
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                user?.nome?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.nome}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">{user?.perfil}</div>
            </div>
            <button
              type="button"
              onClick={() => setEditNameOpen(true)}
              title="Editar meu nome e foto"
              aria-label="Editar meu nome e foto de perfil"
              className="text-slate-400 hover:text-indigo-300 hover:bg-white/10 p-1.5 rounded-lg transition"
            >
              ✏️
            </button>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setEditNameOpen(true)}
            className="w-full text-[11px] text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 px-2 py-1.5 rounded-lg transition-all text-left mb-1"
          >
            ✏️  Editar nome e foto
          </button>
        )}
        <button
          onClick={logout}
          className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/15 px-2 py-1.5 rounded-lg transition-all text-left"
        >
          {collapsed ? '⏏' : '✕  Sair do sistema'}
        </button>
      </div>

      <div className="text-[10px] text-slate-600 text-center pb-2 tracking-widest">v2.1</div>

      <EditDisplayNameModal
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
      />
    </aside>
  );
}
