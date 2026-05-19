// Tela de login — acesso apenas com e-mail e senha
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LucideLock, LucideUser, LucideEye, LucideEyeOff,
  LucideLoader, LucideAlertTriangle, LucideBuilding2, LucidePhone, LucideShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Portão de pré-acesso ──────────────────────────────────────────────
// Validação leve para filtrar acesso ao SIZ. Toda tentativa (correta ou não)
// é enviada para vendas@zenithlacres.com.br via /api/contact.php.
const GATE_KEY = 'zkSizGateAccess';

// Dados corretos (normalizados: só dígitos / lowercase / sem acentos)
const GATE_CORRETO = {
  cnpj:     '10428815000120',
  telefone: '1120240427',
  empresa:  'lacres zenith',
};

const soDigitos   = (s) => String(s || '').replace(/\D+/g, '');
const normNome    = (s) => String(s || '')
  .trim()
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function enviarTentativaAcessoSIZ({ empresa, telefone, cnpj, correto }) {
  try {
    const payload = {
      name:    empresa || 'Acesso SIZ',
      company: empresa,
      cnpj,
      phone:   telefone,
      email:   'acesso-siz@lacres.com.br',
      subject: correto ? '[SIZ] Acesso autorizado' : '[SIZ] Tentativa de acesso',
      message:
        `Tentativa de acesso ao Sistema Interno (SIZ)\n` +
        `Resultado: ${correto ? 'AUTORIZADO ✅' : 'BLOQUEADO ⛔'}\n\n` +
        `Empresa : ${empresa}\n` +
        `Telefone: ${telefone}\n` +
        `CNPJ    : ${cnpj}\n` +
        `URL     : ${window.location.href}\n` +
        `Data    : ${new Date().toLocaleString('pt-BR')}`,
      source: 'siz_access_gate',
      page:   '/estoque/login',
      language: 'pt',
    };
    await fetch('/api/contact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
    });
  } catch (e) {
    console.warn('[siz-gate] falha ao notificar tentativa', e);
  }
}

function GateModal({ onAcesso }) {
  const [empresa, setEmpresa]   = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpj, setCnpj]         = useState('');
  const [erro, setErro]         = useState('');
  const [enviando, setEnviando] = useState(false);

  // Máscaras leves
  const onChangeCnpj = (v) => {
    const d = soDigitos(v).slice(0, 14);
    let out = d;
    if (d.length > 12)     out = `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
    else if (d.length > 8) out = `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
    else if (d.length > 5) out = `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
    else if (d.length > 2) out = `${d.slice(0,2)}.${d.slice(2)}`;
    setCnpj(out);
  };
  const onChangeTel = (v) => {
    const d = soDigitos(v).slice(0, 11);
    let out = d;
    if (d.length > 6)      out = `(${d.slice(0,2)}) ${d.slice(2, d.length-4)}-${d.slice(-4)}`;
    else if (d.length > 2) out = `(${d.slice(0,2)}) ${d.slice(2)}`;
    setTelefone(out);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!empresa.trim() || !telefone.trim() || !cnpj.trim()) {
      setErro('Preencha todos os campos.');
      return;
    }
    setEnviando(true);

    const cnpjOk  = soDigitos(cnpj) === GATE_CORRETO.cnpj;
    const telOk   = soDigitos(telefone) === GATE_CORRETO.telefone;
    const nomeOk  = normNome(empresa) === GATE_CORRETO.empresa;
    const correto = cnpjOk && telOk && nomeOk;

    // Notifica vendas@ — independente de correto ou não
    enviarTentativaAcessoSIZ({ empresa, telefone, cnpj, correto });

    // Pequena espera para evitar brute-force visual
    await new Promise(r => setTimeout(r, 700));

    if (correto) {
      sessionStorage.setItem(GATE_KEY, '1');
      onAcesso();
    } else {
      setErro('Dados incorretos. Verifique CNPJ, telefone e nome da empresa.');
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4"
      style={{ background: 'rgba(8, 6, 30, 0.78)', backdropFilter: 'blur(6px)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl animate-slideup"
        style={{
          background: 'rgba(15, 12, 41, 0.92)',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 8px 64px 0 rgba(99,102,241,0.45), 0 2px 16px 0 rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}
          >
            <LucideShieldCheck className="w-9 h-9 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-white text-center">Acesso Restrito</h2>
        <p className="text-indigo-300 text-sm text-center mt-1 mb-6">
          Informe os dados da empresa para continuar
        </p>

        {/* Empresa */}
        <label className="block text-xs font-medium text-indigo-200 mb-1">Nome da empresa</label>
        <div className="flex items-center rounded-xl px-3 py-2.5 mb-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <LucideBuilding2 className="text-indigo-400 w-5 h-5 mr-2 flex-shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent outline-none text-white placeholder-slate-500 text-sm"
            placeholder="Razão social"
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Telefone */}
        <label className="block text-xs font-medium text-indigo-200 mb-1">Telefone</label>
        <div className="flex items-center rounded-xl px-3 py-2.5 mb-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <LucidePhone className="text-indigo-400 w-5 h-5 mr-2 flex-shrink-0" />
          <input
            type="tel"
            inputMode="numeric"
            className="w-full bg-transparent outline-none text-white placeholder-slate-500 text-sm"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={e => onChangeTel(e.target.value)}
            required
          />
        </div>

        {/* CNPJ */}
        <label className="block text-xs font-medium text-indigo-200 mb-1">CNPJ</label>
        <div className="flex items-center rounded-xl px-3 py-2.5 mb-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <LucideShieldCheck className="text-indigo-400 w-5 h-5 mr-2 flex-shrink-0" />
          <input
            type="text"
            inputMode="numeric"
            className="w-full bg-transparent outline-none text-white placeholder-slate-500 text-sm"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={e => onChangeCnpj(e.target.value)}
            required
          />
        </div>

        {erro && (
          <div className="mb-4 px-4 py-3 rounded-xl border text-sm text-center
            bg-red-500/15 border-red-500/40 text-red-300">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(90deg,#0ea5e9,#6366f1,#8b5cf6)' }}
        >
          {enviando ? (
            <span className="flex items-center justify-center gap-2">
              <LucideLoader className="w-4 h-4 animate-spin" />
              Verificando...
            </span>
          ) : 'Verificar e continuar'}
        </button>

        <p className="text-[10px] text-slate-500 text-center mt-5 leading-relaxed">
          Todas as tentativas de acesso são registradas e notificadas à equipe de vendas.
        </p>
      </form>
    </div>
  );
}

export default function Login() {
  const { login, error, user, sessaoBloqueadaPor, kickedMessage, setKickedMessage } = useAuth();
  const [email, setEmail]           = useState('');
  const [senha, setSenha]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gateLiberado, setGateLiberado] = useState(
    () => sessionStorage.getItem(GATE_KEY) === '1'
  );
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
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
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
  // TELA — FORMULÁRIO DE LOGIN
  // ════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #1a1040 70%, #0f172a 100%)' }}
    >
      <a
        href="https://lacres.com.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 left-4 z-[9999] rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:scale-[1.03]"
        style={{
          background: 'linear-gradient(135deg,#0f766e 0%,#0ea5e9 100%)',
          border: '1px solid rgba(255,255,255,0.35)',
        }}
      >
        Voltar para o site
      </a>

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

      {!gateLiberado && <GateModal onAcesso={() => setGateLiberado(true)} />}
    </div>
  );
}
