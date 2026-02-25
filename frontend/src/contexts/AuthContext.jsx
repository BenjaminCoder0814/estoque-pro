// Contexto de autenticação com controle de horário comercial e sessão única
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

// ──────────────────────────────────────────────
// USUÁRIOS DO SISTEMA
// ──────────────────────────────────────────────
const USUARIOS_PADRAO = [
  { id: 1, email: 'admin@zenith.com',       senha: '123456',    nome: 'Administrador', perfil: 'ADMIN',       restricaoHorario: false },
  { id: 2, email: 'expedicao@zenith.com',   senha: 'exped2026', nome: 'Expedição',     perfil: 'EXPEDICAO',   restricaoHorario: true  },
  { id: 3, email: 'compras@zenith.com',     senha: 'lari2026',  nome: 'Compras',       perfil: 'COMPRAS',     restricaoHorario: true  },
  { id: 4, email: 'supervisao@zenith.com',  senha: 'super2026', nome: 'Supervisão',    perfil: 'SUPERVISAO',  restricaoHorario: true  },
  { id: 5, email: 'comercial@zenith.com',   senha: 'com2026',   nome: 'Comercial',     perfil: 'COMERCIAL',   restricaoHorario: true  },
  { id: 6, email: 'producao@zenith.com',    senha: 'prod2026',  nome: 'Produção',      perfil: 'PRODUCAO',    restricaoHorario: true  },
];

export const PERFIS = ['ADMIN', 'EXPEDICAO', 'COMPRAS', 'SUPERVISAO', 'COMERCIAL', 'PRODUCAO'];

// ──────────────────────────────────────────────
// SESSÃO ATIVA (controle de acesso único não-admin)
// ──────────────────────────────────────────────
const SESSAO_KEY   = 'zkSessaoAtiva';
const KICK_KEY     = 'zkSessaoKick';

function genSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSessaoAtiva() {
  try {
    const raw = localStorage.getItem(SESSAO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setSessaoAtiva(userData) {
  if (userData) {
    localStorage.setItem(SESSAO_KEY, JSON.stringify({
      id: userData.id, nome: userData.nome, email: userData.email,
      perfil: userData.perfil, inicio: new Date().toISOString(),
      sessionId: userData.sessionId,
    }));
  } else {
    localStorage.removeItem(SESSAO_KEY);
  }
}

// Sinaliza que uma sessão específica deve ser derrubada
function enviarSinalKick(targetSessionId, byNome) {
  localStorage.setItem(KICK_KEY, JSON.stringify({
    targetSessionId,
    by: byNome,
    ts: Date.now(),
  }));
}

function getKickSignal() {
  try { return JSON.parse(localStorage.getItem(KICK_KEY) || 'null'); } catch { return null; }
}

function clearKickSignal() { localStorage.removeItem(KICK_KEY); }

// ──────────────────────────────────────────────
// VERIFICAÇÃO DE HORÁRIO COMERCIAL
// Seg–Qui: 07:00–18:00 | Sex: 07:00–16:00
// Sáb/Dom: sem acesso
// ──────────────────────────────────────────────
export function verificarHorarioComercial() {
  const agora = new Date();
  const dia = agora.getDay(); // 0=Dom … 6=Sáb
  const totalMin = agora.getHours() * 60 + agora.getMinutes();
  const inicio   = 7  * 60; // 07:00
  const fimSex   = 16 * 60; // 16:00 sexta
  const fimNorm  = 18 * 60; // 18:00 seg-qui

  if (dia === 0 || dia === 6)
    return { ok: false, motivo: 'Acesso permitido apenas de segunda a sexta-feira.' };
  if (dia === 5) {
    if (totalMin < inicio || totalMin >= fimSex)
      return { ok: false, motivo: 'Na sexta-feira o acesso é das 07:00 às 16:00.' };
  } else {
    if (totalMin < inicio || totalMin >= fimNorm)
      return { ok: false, motivo: 'De segunda a quinta o acesso é das 07:00 às 18:00.' };
  }
  return { ok: true };
}

// ──────────────────────────────────────────────
// HELPERS localStorage
// ──────────────────────────────────────────────
const USUARIOS_VERSION = 'v5'; // Incremente para forçar reset dos usuários padrão

function loadUsuarios() {
  try {
    // Se a versão mudou, reseta para os novos padrões
    const versao = localStorage.getItem('zkUsuariosVersion');
    if (versao !== USUARIOS_VERSION) {
      saveUsuarios(USUARIOS_PADRAO);
      localStorage.setItem('zkUsuariosVersion', USUARIOS_VERSION);
      return USUARIOS_PADRAO;
    }
    const raw = localStorage.getItem('zkUsuarios');
    if (raw) return JSON.parse(raw);
  } catch {}
  saveUsuarios(USUARIOS_PADRAO);
  localStorage.setItem('zkUsuariosVersion', USUARIOS_VERSION);
  return USUARIOS_PADRAO;
}

function saveUsuarios(lista) {
  localStorage.setItem('zkUsuarios', JSON.stringify(lista));
}

// ──────────────────────────────────────────────
// PROVIDER
// ──────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('zkuser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [error, setError]                           = useState(null);
  const [sessaoBloqueadaPor, setSessaoBloqueadaPor] = useState(null);
  const [kickedMessage, setKickedMessage]           = useState(null);
  const [usuarios, setUsuariosState]                = useState(loadUsuarios);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── INATIVIDADE: LOGOUT AUTOMÁTICO APÓS 20 min ─────────────────
  const INATIVIDADE_LIMIT = 20 * 60 * 1000; // 20 minutos
  const ATIVIDADE_KEY = 'zkLastActivity';

  function registrarAtividade() {
    localStorage.setItem(ATIVIDADE_KEY, Date.now().toString());
  }

  // Ouve eventos de atividade do usuário
  useEffect(() => {
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => registrarAtividade();
    eventos.forEach(e => window.addEventListener(e, handler, { passive: true }));
    // Inicializa
    registrarAtividade();
    return () => eventos.forEach(e => window.removeEventListener(e, handler));
  }, []);

  // Verifica inatividade a cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      const last = Number(localStorage.getItem(ATIVIDADE_KEY) || Date.now());
      if (Date.now() - last > INATIVIDADE_LIMIT) {
        // Limpa sessão por inatividade
        if (currentUser.perfil !== 'ADMIN') {
          const sessao = getSessaoAtiva();
          if (sessao && sessao.id === currentUser.id) setSessaoAtiva(null);
        }
        setUser(null);
        localStorage.removeItem('zkuser');
        setKickedMessage('⏰ Você foi desconectado por inatividade (20 minutos sem atividade).');
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Limpa sessão ao fechar a aba (não-admin)
  useEffect(() => {
    const handle = () => {
      const currentUser = userRef.current;
      if (currentUser && currentUser.perfil !== 'ADMIN') {
        setSessaoAtiva(null);
      }
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, []);

  // ── POLLING: DETECTA SE ESTA SESSÃO FOI DERRUBADA ─────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = userRef.current;
      if (!currentUser || currentUser.perfil === 'ADMIN') return;
      const kick = getKickSignal();
      if (kick && kick.targetSessionId && kick.targetSessionId === currentUser.sessionId) {
        clearKickSignal();
        // Limpa sessão local
        setSessaoAtiva(null);
        setUser(null);
        localStorage.removeItem('zkuser');
        setKickedMessage(
          `⚠️ Sua sessão foi encerrada pelo Administrador (${kick.by}). Você foi desconectado.`
        );
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── LOGIN ──────────────────────────────────
  function login(email, senha) {
    setError(null);
    setSessaoBloqueadaPor(null);
    setKickedMessage(null);
    const lista = loadUsuarios();
    const found = lista.find(u => u.email === email && u.senha === senha);

    if (!found) {
      setError('E-mail ou senha inválidos.');
      return false;
    }

    // Verifica horário comercial para não-admin
    if (found.restricaoHorario) {
      const h = verificarHorarioComercial();
      if (!h.ok) {
        setError(`Fora do horário comercial. ${h.motivo}`);
        return false;
      }
    }

    const sessao = getSessaoAtiva();

    if (found.perfil === 'ADMIN') {
      // ADMIN: derruba qualquer sessão ativa existente
      if (sessao) {
        enviarSinalKick(sessao.sessionId, found.nome);
        setSessaoAtiva(null);
      }
    } else {
      // Não-admin: bloqueia se outro usuário diferente já está ativo
      if (sessao && sessao.id !== found.id) {
        setSessaoBloqueadaPor(sessao.nome);
        setError(
          `⛔ Acesso bloqueado! "${sessao.nome}" está utilizando o sistema no momento. ` +
          `Apenas um acesso simultâneo é permitido. Aguarde o logout ou solicite ao Administrador.`
        );
        return false;
      }
    }

    const sessionId = genSessionId();
    const userData = {
      id: found.id, email: found.email, nome: found.nome,
      perfil: found.perfil, restricaoHorario: found.restricaoHorario ?? false,
      sessionId,
    };

    setUser(userData);
    localStorage.setItem('zkuser', JSON.stringify(userData));

    // Registra sessão ativa apenas para não-admin
    if (found.perfil !== 'ADMIN') setSessaoAtiva(userData);

    return true;
  }

  // ── LOGOUT ─────────────────────────────────
  function logout() {
    const currentUser = userRef.current;
    if (currentUser && currentUser.perfil !== 'ADMIN') {
      const sessao = getSessaoAtiva();
      if (sessao && sessao.id === currentUser.id) setSessaoAtiva(null);
    }
    setUser(null);
    localStorage.removeItem('zkuser');
  }

  // ── CRUD USUÁRIOS ──────────────────────────
  function criarUsuario(dados) {
    const lista = loadUsuarios();
    const nextId = Math.max(0, ...lista.map(u => u.id)) + 1;
    const novo = { ...dados, id: nextId };
    const nova = [...lista, novo];
    saveUsuarios(nova);
    setUsuariosState(nova);
  }

  function editarUsuario(id, dados) {
    const lista = loadUsuarios();
    const nova = lista.map(u => u.id === id ? { ...u, ...dados } : u);
    saveUsuarios(nova);
    setUsuariosState(nova);
    if (user?.id === id) {
      const at = nova.find(u => u.id === id);
      if (at) {
        const sess = { id: at.id, email: at.email, nome: at.nome, perfil: at.perfil, restricaoHorario: at.restricaoHorario };
        setUser(sess);
        localStorage.setItem('zkuser', JSON.stringify(sess));
      }
    }
  }

  function excluirUsuario(id) {
    if (user?.id === id) return;
    const lista = loadUsuarios();
    const nova = lista.filter(u => u.id !== id);
    saveUsuarios(nova);
    setUsuariosState(nova);
  }

  // ── PERMISSÕES POR PERFIL ──────────────────
  // ADMIN:      tudo, sem restrição
  // EXPEDICAO:  Produtos, Histórico, Pendentes, Entrada (confirmar)
  // COMPRAS:    Produtos (vis.), Alertas, Pendentes (criar pedido)
  // SUPERVISAO: Produtos (vis.), Histórico
  // COMERCIAL:  Somente Produtos (visualização)
  const can = {
    verDashboard:         user && ['ADMIN'].includes(user.perfil),
    verProdutos:          !!user,
    editarProdutos:       user && ['ADMIN', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    excluirProdutos:      user && ['ADMIN'].includes(user.perfil),
    fazerMovimentacoes:   user && ['ADMIN', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    verHistorico:         user && ['ADMIN', 'EXPEDICAO', 'SUPERVISAO', 'PRODUCAO'].includes(user.perfil),
    verAlertas:           user && ['ADMIN', 'COMPRAS', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    verPendentes:         user && ['ADMIN', 'EXPEDICAO', 'COMPRAS', 'PRODUCAO'].includes(user.perfil),
    verAuditoria:         user && ['ADMIN'].includes(user.perfil),
    verEntrada:           user && ['ADMIN', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    confirmarEntrada:     user && ['ADMIN', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    marcarPedido:         user && ['COMPRAS'].includes(user.perfil),
    verSugestoes:         !!user,
    gerenciarUsuarios:    user && ['ADMIN'].includes(user.perfil),
    verPrecos:            user && ['ADMIN', 'SUPERVISAO', 'COMERCIAL', 'COMPRAS'].includes(user.perfil),
    editarPrecos:         user && ['ADMIN', 'SUPERVISAO'].includes(user.perfil),
    verMidia:             user && ['ADMIN', 'SUPERVISAO', 'COMERCIAL'].includes(user.perfil),
    // Separações
    verSeparacoes:        user && ['ADMIN', 'EXPEDICAO', 'COMERCIAL', 'SUPERVISAO', 'PRODUCAO'].includes(user.perfil),
    criarSeparacao:       user && ['ADMIN', 'COMERCIAL'].includes(user.perfil),
    avancarSeparacao:     user && ['ADMIN', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    editarSeparacao:      user && ['ADMIN'].includes(user.perfil),
    cancelarSeparacao:    user && ['ADMIN'].includes(user.perfil),
    // Chat
    verChat:              !!user,
    verChatTotal:         user?.perfil === 'ADMIN',
    verCubagem:           user && ['ADMIN', 'SUPERVISAO', 'COMERCIAL'].includes(user.perfil),
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, error, can,
      sessaoBloqueadaPor, kickedMessage, setKickedMessage,
      usuarios, PERFIS,
      criarUsuario, editarUsuario, excluirUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
