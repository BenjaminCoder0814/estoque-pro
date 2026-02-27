// TourGuide.jsx — Tour guiado interativo para visitantes de portfólio
// Exibe modal de boas-vindas + tour passo a passo pelo sistema
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LucideX, LucideChevronRight, LucideChevronLeft,
  LucideMap, LucideCheckCircle, LucideMinus, LucideEye,
} from 'lucide-react';

const TOUR_KEY = 'zkTourFase';

// ── Passos do tour ─────────────────────────────────────────────────────
const STEPS = [
  {
    route: '/',
    icon: '📊',
    title: 'Dashboard',
    desc: 'Visão geral do estoque em tempo real. KPIs de produtos, alertas críticos, últimas entradas e saídas — tudo num único painel.',
  },
  {
    route: '/produtos',
    icon: '📦',
    title: 'Produtos',
    desc: 'Catálogo completo com foto, código, categoria, estoque atual e mínimo. Busca e filtros por categoria, alertas automáticos de reposição.',
  },
  {
    route: '/separacoes',
    icon: '🚚',
    title: 'Separações',
    desc: 'Gestão de pedidos com fluxo Kanban: Criado → Em Separação → Conferência → Concluído. Rastreio completo de quem separou e quando.',
  },
  {
    route: '/precos',
    icon: '🏷️',
    title: 'Tabela de Preços',
    desc: 'Catálogo de preços por categoria: Atacado / Varejo / Unidade. Sincronizado em tempo real via Firebase para todos os usuários.',
  },
  {
    route: '/entrada',
    icon: '✅',
    title: 'Entrada de Estoque',
    desc: 'Registro de novas entradas com número de nota fiscal e baixa automática nos pedidos pendentes.',
  },
  {
    route: '/movimentacoes',
    icon: '📋',
    title: 'Histórico',
    desc: 'Log completo de todas as entradas e saídas: data, responsável, quantidade e motivo. Filtros por período e produto.',
  },
  {
    route: '/alertas',
    icon: '⚠️',
    title: 'Alertas',
    desc: 'Produtos abaixo do estoque mínimo são sinalizados automaticamente para facilitar o reabastecimento a tempo.',
  },
  {
    route: '/pendentes',
    icon: '🕐',
    title: 'Pendentes',
    desc: 'Pedidos de compra aguardando aprovação ou entrega. Controle de status e prazo estimado.',
  },
  {
    route: '/midia',
    icon: '🖼️',
    title: 'Galeria de Mídia',
    desc: 'Galeria com fotos de todos os produtos organizados por categoria. Suporte a download e visualização em tela cheia.',
  },
  {
    route: '/cubagem',
    icon: '📐',
    title: 'Cubagem',
    desc: 'Calculadora de cubagem para otimizar espaço em fretes e armazenamento.',
  },
  {
    route: '/sugestoes',
    icon: '💡',
    title: 'Sugestões',
    desc: 'Canal de sugestões internas entre equipes, com status (aberto / em análise / implementado) e histórico.',
  },
  {
    route: '/auditoria',
    icon: '🔍',
    title: 'Auditoria',
    desc: 'Logs completos de todas as ações: quem fez o quê e quando. Inclui histórico de preços em tempo real via Firebase.',
  },
];

export default function TourGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fase, setFase] = useState(() => {
    try { return localStorage.getItem(TOUR_KEY) || 'welcome'; } catch { return 'welcome'; }
  });
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);

  // Limpa o tour do localStorage quando o visitante fizer logout
  useEffect(() => {
    if (!user || user.perfil !== 'VISITANTE') {
      // Se não é visitante, remove o estado salvo
      try { localStorage.removeItem(TOUR_KEY); } catch {}
    }
  }, [user]);

  if (!user || user.perfil !== 'VISITANTE') return null;

  function saveFase(f) {
    setFase(f);
    try { localStorage.setItem(TOUR_KEY, f); } catch {}
  }

  function iniciarTour() {
    saveFase('tour');
    setStep(0);
    setMinimized(false);
    navigate(STEPS[0].route);
  }

  function pularTour() {
    saveFase('done');
  }

  function irPara(idx) {
    setStep(idx);
    navigate(STEPS[idx].route);
    setMinimized(false);
  }

  function proximo() {
    if (step < STEPS.length - 1) irPara(step + 1);
    else saveFase('done');
  }

  function anterior() {
    if (step > 0) irPara(step - 1);
  }

  function reiniciarTour() {
    saveFase('welcome');
    setStep(0);
    setMinimized(false);
  }

  // ── MODAL DE BOAS-VINDAS ────────────────────────────────────────────
  if (fase === 'welcome') {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div
          className="relative max-w-lg w-full mx-4 rounded-3xl overflow-hidden shadow-2xl animate-slideup"
          style={{
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #1a1040 100%)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 8px 64px rgba(99,102,241,0.5)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-4 text-center">
            <div className="text-6xl mb-4 animate-bounce-slow">👋</div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Bem-vindo ao Portfólio!</h1>
            <p className="text-indigo-300 text-sm leading-relaxed">
              Você está visualizando o{' '}
              <strong className="text-white">Estoque Pro Zenith</strong>, um sistema completo de
              controle de estoque desenvolvido do zero.
            </p>
          </div>

          {/* Tech stack */}
          <div className="px-8 py-4 grid grid-cols-2 gap-2.5 text-xs">
            {[
              ['⚛️', 'React 18 + Vite'],
              ['🔥', 'Firebase Firestore'],
              ['🎨', 'Tailwind CSS'],
              ['📡', 'Sync Tempo Real'],
              ['📱', 'Design Responsivo'],
              ['🔐', 'Controle de Acesso'],
            ].map(([icon, label]) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.22)',
                }}
              >
                <span className="text-base">{icon}</span>
                <span className="text-slate-300 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Info visitante */}
          <div
            className="mx-8 mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <LucideEye className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-300 leading-relaxed">
              Você está no <strong>modo visitante</strong>. Pode navegar por todas as telas e
              funcionalidades, mas não pode criar, editar ou excluir dados. Tudo que você vê é
              o sistema real em funcionamento.
            </p>
          </div>

          {/* Botões */}
          <div className="px-8 pb-8 flex flex-col gap-3">
            <button
              onClick={iniciarTour}
              className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }}
            >
              🗺️ Iniciar Tour Guiado ({STEPS.length} seções)
            </button>
            <button
              onClick={pularTour}
              className="w-full py-2.5 rounded-xl text-slate-400 text-sm hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Explorar livremente (sem tour)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── BOTÃO FLUTUANTE QUANDO TOUR CONCLUÍDO ──────────────────────────
  if (fase === 'done') {
    return (
      <button
        onClick={reiniciarTour}
        title="Ver boas-vindas / reiniciar tour"
        className="fixed bottom-6 right-6 z-[9997] flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-white text-sm shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.5)' }}
      >
        <LucideMap className="w-4 h-4" />
        Tour
      </button>
    );
  }

  // ── BOTÃO MINIMIZADO ────────────────────────────────────────────────
  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); navigate(STEPS[step].route); }}
        className="fixed bottom-6 right-6 z-[9997] flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-white text-sm shadow-2xl hover:scale-105 transition-all"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.5)' }}
      >
        <LucideMap className="w-4 h-4" />
        {step + 1}/{STEPS.length}
      </button>
    );
  }

  // ── CARD DO TOUR ────────────────────────────────────────────────────
  const s = STEPS[step];
  return (
    <div
      className="fixed bottom-6 right-6 z-[9997] w-80 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
        border: '1px solid rgba(139,92,246,0.45)',
        boxShadow: '0 8px 40px rgba(99,102,241,0.45)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <LucideMap className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
            Tour Guiado
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMinimized(true)}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition-colors"
            title="Minimizar"
          >
            <LucideMinus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={pularTour}
            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors"
            title="Fechar tour"
          >
            <LucideX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Barra de progresso dots */}
      <div className="flex items-center gap-1 px-4 pb-3 pt-1">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => irPara(i)}
            title={STEPS[i].title}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? 'bg-indigo-400 w-5'
                : i < step
                ? 'bg-indigo-700 w-2'
                : 'bg-slate-700 w-2'
            }`}
          />
        ))}
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-3">
        <div className="text-3xl mb-2 leading-none">{s.icon}</div>
        <h3 className="text-white font-bold text-sm mb-1.5">{s.title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <button
          onClick={anterior}
          disabled={step === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 disabled:opacity-25 hover:text-white hover:bg-white/10 transition-all"
        >
          <LucideChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <button
          onClick={proximo}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background:
              step === STEPS.length - 1
                ? 'linear-gradient(90deg,#10b981,#059669)'
                : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
          }}
        >
          {step === STEPS.length - 1 ? (
            <>
              <LucideCheckCircle className="w-3.5 h-3.5" />
              Concluir
            </>
          ) : (
            <>
              Próximo
              <LucideChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
