// Contexto de autenticação com controle de horário comercial e sessão única
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();
const PERFIS_SEM_RESTRICAO = ['ADMIN', 'TI', 'DIRETORIA'];

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
  { id: 7, email: 'centralatendimento@zenith.com', senha: 'atendimento2026', nome: 'Central Atendimento', perfil: 'ADMIN', restricaoHorario: false },
  { id: 13, email: 'ti@zenith.com',          senha: 'ti2026',    nome: 'TI',            perfil: 'TI',          restricaoHorario: false },
  // Equipe de vendas — perfil COMERCIAL, com restrição de horário comercial
  { id: 8,  email: 'vendas1@zenith.com',  senha: 'vendas12026',  nome: 'Vendas 1',  perfil: 'COMERCIAL', restricaoHorario: true },
  { id: 9,  email: 'vendas5@zenith.com',  senha: 'vendas52026',  nome: 'Vendas 5',  perfil: 'COMERCIAL', restricaoHorario: true },
  { id: 10, email: 'vendas10@zenith.com', senha: 'vendas102026', nome: 'Vendas 10', perfil: 'COMERCIAL', restricaoHorario: true },
  { id: 11, email: 'vendas12@zenith.com', senha: 'vendas122026', nome: 'Vendas 12', perfil: 'COMERCIAL', restricaoHorario: true },
  { id: 12, email: 'vendas3@zenith.com',  senha: 'vendas32026',  nome: 'Vendas 3',  perfil: 'COMERCIAL', restricaoHorario: true },
  // Visitante de portfólio — somente visualização, sem restrição de horário
  { id: 99, email: 'visitante@zenith.com',  senha: 'demo2026',  nome: 'Visitante',     perfil: 'VISITANTE',   restricaoHorario: false },
];

export const PERFIS = ['ADMIN', 'TI', 'EXPEDICAO', 'COMPRAS', 'SUPERVISAO', 'COMERCIAL', 'PRODUCAO', 'VISITANTE'];

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
const USUARIOS_VERSION = 'v10'; // Incremente para forçar reset dos usuários padrão

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

  // Sem timeout por inatividade: sessao permanece ativa
  // enquanto estiver dentro das regras de horario e sessao unica.

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
    // Normaliza e-mail: tira espaços, minúsculas e trata @zenithlacres.com(.br)
    // como equivalente a @zenith.com (evita falha por digitação do domínio).
    const canon = (e) => String(e || '').trim().toLowerCase().replace(/@zenithlacres\.com(\.br)?$/, '@zenith.com');
    const emailNorm = canon(email);
    const found = lista.find(u => canon(u.email) === emailNorm && u.senha === senha);

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

    if (PERFIS_SEM_RESTRICAO.includes(found.perfil)) {
      // ADMIN: derruba qualquer sessão ativa existente
      if (sessao) {
        enviarSinalKick(sessao.sessionId, found.nome);
        setSessaoAtiva(null);
      }
    } else if (found.perfil === 'VISITANTE') {
      // VISITANTE: sempre permitido, sem bloquear outros
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

    // Registra sessão ativa apenas para não-admin e não-visitante
    if (!PERFIS_SEM_RESTRICAO.includes(found.perfil) && found.perfil !== 'VISITANTE') setSessaoAtiva(userData);

    return true;
  }

  // ── LOGOUT ─────────────────────────────────
  function logout() {
    const currentUser = userRef.current;
    if (currentUser && !PERFIS_SEM_RESTRICAO.includes(currentUser.perfil)) {
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
  const isVisitante = user?.perfil === 'VISITANTE';
  const isAdminLike = PERFIS_SEM_RESTRICAO.includes(user?.perfil);
  const can = {
    verDashboard:         !!user && (isAdminLike || user.perfil === 'VISITANTE'),
    verProdutos:          !!user,
    editarProdutos:       !isVisitante && !!user && (isAdminLike || ['EXPEDICAO', 'PRODUCAO'].includes(user.perfil)),
    excluirProdutos:      !isVisitante && !!user && isAdminLike,
    fazerMovimentacoes:   !isVisitante && !!user && (isAdminLike || ['EXPEDICAO', 'PRODUCAO'].includes(user.perfil)),
    verHistorico:         !!user && (isAdminLike || ['EXPEDICAO', 'SUPERVISAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil)),
    verAlertas:           !!user && (isAdminLike || ['COMPRAS', 'EXPEDICAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil)),
    verPendentes:         !!user && (isAdminLike || ['EXPEDICAO', 'COMPRAS', 'PRODUCAO', 'VISITANTE'].includes(user.perfil)),
    verAuditoria:         !!user && (isAdminLike || user.perfil === 'VISITANTE'),
    verEntrada:           !!user && (isAdminLike || ['EXPEDICAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil)),
    confirmarEntrada:     !isVisitante && !!user && (isAdminLike || ['EXPEDICAO', 'PRODUCAO'].includes(user.perfil)),
    marcarPedido:         !isVisitante && user && ['COMPRAS'].includes(user.perfil),
    verSugestoes:         !!user,
    gerenciarUsuarios:    !isVisitante && !!user && isAdminLike,
    verPrecos:            !!user && (isAdminLike || ['SUPERVISAO', 'COMERCIAL', 'COMPRAS', 'VISITANTE'].includes(user.perfil)),
    editarPrecos:         !isVisitante && !!user && (isAdminLike || user.perfil === 'SUPERVISAO'),
    verMidia:             !!user && (isAdminLike || ['SUPERVISAO', 'COMERCIAL', 'VISITANTE'].includes(user.perfil)),
    // Separações
    verSeparacoes:        !!user && (isAdminLike || ['EXPEDICAO', 'COMERCIAL', 'SUPERVISAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil)),
    criarSeparacao:       !isVisitante && !!user && (isAdminLike || user.perfil === 'COMERCIAL'),
    avancarSeparacao:     !isVisitante && !!user && (isAdminLike || ['EXPEDICAO', 'PRODUCAO'].includes(user.perfil)),
    editarSeparacao:      !isVisitante && !!user && isAdminLike,
    cancelarSeparacao:    !isVisitante && !!user && isAdminLike,
    // Chat — visitante não participa do chat interno
    verChat:              !!user && !isVisitante,
    verChatTotal:         isAdminLike,
    verCubagem:           !!user && (isAdminLike || ['SUPERVISAO', 'COMERCIAL', 'VISITANTE'].includes(user.perfil)),
    verPortaria:          !!user && (isAdminLike || ['EXPEDICAO', 'SUPERVISAO'].includes(user.perfil)),
    gerirPortaria:        !isVisitante && !!user && (isAdminLike || ['EXPEDICAO'].includes(user.perfil)),
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
