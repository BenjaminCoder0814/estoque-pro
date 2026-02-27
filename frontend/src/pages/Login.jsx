// Tela de login — seleção de modo: Colaborador ou Visitante
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LucideLock, LucideUser, LucideEye, LucideEyeOff,
  LucideLoader, LucideAlertTriangle, LucideChevronLeft,
  LucideUsers, LucideEye as LucideEyeIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, error, user, sessaoBloqueadaPor, kickedMessage, setKickedMessage } = useAuth();
  const [modo, setModo]             = useState('escolha'); // 'escolha' | 'colaborador'
  const [email, setEmail]           = useState('');
  const [senha, setSenha]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // ── Login colaborador ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setKickedMessage(null);
    setLoading(true);
    await login(email, senha);
    setLoading(false);
  };

  // ── Login visitante direto ────────────────────────────────────────────
  const entrarVisitante = async () => {
    setKickedMessage(null);
    setLoading(true);
    await login('visitante@zenith.com', 'demo2026');
    setLoading(false);
  };

  // ── Fundo animado + orbs ─────────────────────────────────────────────
  const fundo = (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-spin-slow"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
      <div className="absolute top-1/3 right-1/4 w-60 h-60 rounded-full opacity-15 animate-float"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
    </div>
  );

  // ── Cabeçalho do card (logo + título) ────────────────────────────────
  const cabecalho = (
    <>
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-glow animate-bounce-slow"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Bem-vindo</h1>
        <p className="text-indigo-300 text-sm mt-1 tracking-wide">Sistema de Controle de Estoque</p>
        <div className="mt-3 mx-auto w-16 h-0.5 rounded"
          style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }} />
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════
  // TELA 1 — ESCOLHA DE MODO
  // ════════════════════════════════════════════════════════════════
  if (modo === 'escolha') {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #1a1040 70%, #0f172a 100%)' }}
      >
        {fundo}

        <div
          className="relative w-full max-w-md mx-4 rounded-3xl p-10 shadow-2xl animate-slideup"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 64px 0 rgba(99,102,241,0.35), 0 2px 16px 0 rgba(0,0,0,0.4)',
          }}
        >
          {cabecalho}

          <p className="text-center text-slate-400 text-sm mb-8">
            Como deseja acessar o sistema?
          </p>

          <div className="flex flex-col gap-4">
            {/* ── Botão Colaborador ── */}
            <button
              onClick={() => setModo('colaborador')}
              className="group w-full rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))',
                border: '1px solid rgba(99,102,241,0.4)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                >
                  <LucideUsers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-base">Sou Colaborador</div>
                  <div className="text-slate-400 text-xs mt-0.5">Acesso com e-mail e senha da empresa</div>
                </div>
                <LucideChevronLeft className="w-5 h-5 text-slate-500 ml-auto rotate-180 group-hover:text-indigo-400 transition-colors" />
              </div>
            </button>

            {/* ── Botão Visitante ── */}
            <button
              onClick={entrarVisitante}
              disabled={loading}
              className="group w-full rounded-2xl p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.10))',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                >
                  {loading
                    ? <LucideLoader className="w-6 h-6 text-white animate-spin" />
                    : <LucideEyeIcon className="w-6 h-6 text-white" />
                  }
                </div>
                <div>
                  <div className="text-white font-bold text-base">
                    {loading ? 'Entrando...' : 'Só quero visualizar'}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    Tour guiado · somente visualização · sem cadastro
                  </div>
                </div>
              </div>
            </button>
          </div>

          {kickedMessage && (
            <div className="mt-5 px-4 py-3 rounded-xl border text-sm text-center leading-snug animate-slideup"
              style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.5)', color: '#fde68a' }}>
              <div className="flex items-center justify-center gap-2 font-semibold mb-1">
                <LucideAlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                Sessão encerrada
              </div>
              <p className="text-xs opacity-90">{kickedMessage}</p>
            </div>
          )}

          <p className="text-center text-[11px] text-slate-600 mt-8 tracking-wide">
            ZENITH &bull; Estoque Pro &bull; Sistema v2.1
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // TELA 2 — FORMULÁRIO COLABORADOR
  // ════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #1a1040 70%, #0f172a 100%)' }}
    >
      {fundo}

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md mx-4 rounded-3xl p-10 shadow-2xl animate-slideup"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 64px 0 rgba(99,102,241,0.35), 0 2px 16px 0 rgba(0,0,0,0.4)',
        }}
      >
        {/* Voltar */}
        <button
          type="button"
          onClick={() => { setModo('escolha'); setEmail(''); setSenha(''); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 text-xs mb-6 transition-colors"
        >
          <LucideChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        {cabecalho}

        {/* Campo e-mail */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-indigo-200">E-mail</label>
          <div
            className="flex items-center rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <LucideUser className="text-indigo-400 w-5 h-5 mr-2 flex-shrink-0" />
            <input
              type="email"
              className="w-full bg-transparent outline-none text-white placeholder-slate-400 text-sm"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Campo senha */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1.5 text-indigo-200">Senha</label>
          <div
            className="flex items-center rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <LucideLock className="text-indigo-400 w-5 h-5 mr-2 flex-shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-transparent outline-none text-white placeholder-slate-400 text-sm"
              placeholder="••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="text-slate-400 hover:text-indigo-300 ml-2 transition-colors"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <LucideEyeOff className="w-4 h-4" /> : <LucideEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {kickedMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl border text-sm text-center leading-snug animate-slideup"
            style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.5)', color: '#fde68a' }}>
            <div className="flex items-center justify-center gap-2 font-semibold mb-1">
              <LucideAlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              Sessão encerrada
            </div>
            <p className="text-xs opacity-90">{kickedMessage}</p>
          </div>
        )}

        {error && (
          <div className={`mb-4 px-4 py-3 rounded-xl border text-sm text-center leading-snug
            ${sessaoBloqueadaPor
              ? 'bg-red-600/30 border-red-500/60 text-red-200'
              : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
            {error}
            {sessaoBloqueadaPor && (
              <p className="mt-1 text-xs text-red-300 opacity-80">
                Aguarde o logout de <strong>{sessaoBloqueadaPor}</strong> ou contate o Administrador.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide shadow-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)', backgroundSize: '200% auto' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LucideLoader className="w-4 h-4 animate-spin" />
              Verificando...
            </span>
          ) : 'Entrar no Sistema'}
        </button>

        <p className="text-center text-[11px] text-slate-600 mt-6 tracking-wide">
          ZENITH &bull; Estoque Pro &bull; Sistema v2.1
        </p>
      </form>
    </div>
  );
}
