// Contexto de autenticação com API + fallback local
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest, setStoredToken, getStoredToken } from '../services/apiClient';

const AuthContext = createContext();

const USUARIOS_PADRAO = [
  { id: 1, email: 'admin@zenith.com',       senha: '123456',    nome: 'Administrador', perfil: 'ADMIN',       restricaoHorario: false },
  { id: 2, email: 'expedicao@zenith.com',   senha: 'exped2026', nome: 'Expedição',     perfil: 'EXPEDICAO',   restricaoHorario: true  },
  { id: 3, email: 'compras@zenith.com',     senha: 'lari2026',  nome: 'Compras',       perfil: 'COMPRAS',     restricaoHorario: true  },
  { id: 4, email: 'supervisao@zenith.com',  senha: 'super2026', nome: 'Supervisão',    perfil: 'SUPERVISAO',  restricaoHorario: true  },
  { id: 5, email: 'comercial@zenith.com',   senha: 'com2026',   nome: 'Comercial',     perfil: 'COMERCIAL',   restricaoHorario: true  },
  { id: 6, email: 'producao@zenith.com',    senha: 'prod2026',  nome: 'Produção',      perfil: 'PRODUCAO',    restricaoHorario: true  },
  { id: 7, email: 'ti@zenith.com',          senha: 'ti2026',    nome: 'TI',            perfil: 'TI',          restricaoHorario: false },
];

export const PERFIS = ['ADMIN', 'TI', 'EXPEDICAO', 'COMPRAS', 'SUPERVISAO', 'COMERCIAL', 'PRODUCAO'];

const USUARIOS_VERSION = 'v9-ti';

const SESSAO_KEY = 'zkSessaoAtiva';
const KICK_KEY = 'zkSessaoKick';

function genSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSessaoAtiva() {
  try {
    const raw = localStorage.getItem(SESSAO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSessaoAtiva(userData) {
  if (userData) {
    localStorage.setItem(SESSAO_KEY, JSON.stringify({
      id: userData.id,
      nome: userData.nome,
      email: userData.email,
      perfil: userData.perfil,
      inicio: new Date().toISOString(),
      sessionId: userData.sessionId,
    }));
  } else {
    localStorage.removeItem(SESSAO_KEY);
  }
}

function enviarSinalKick(targetSessionId, byNome) {
  localStorage.setItem(KICK_KEY, JSON.stringify({
    targetSessionId,
    by: byNome,
    ts: Date.now(),
  }));
}

function getKickSignal() {
  try {
    return JSON.parse(localStorage.getItem(KICK_KEY) || 'null');
  } catch {
    return null;
  }
}

function clearKickSignal() {
  localStorage.removeItem(KICK_KEY);
}

export function verificarHorarioComercial() {
  const agora = new Date();
  const dia = agora.getDay();
  const totalMin = agora.getHours() * 60 + agora.getMinutes();
  const inicio = 7 * 60;
  const fimSex = 16 * 60;
  const fimNorm = 18 * 60;

  if (dia === 0 || dia === 6) {
    return { ok: false, motivo: 'Acesso permitido apenas de segunda a sexta-feira.' };
  }
  if (dia === 5) {
    if (totalMin < inicio || totalMin >= fimSex) {
      return { ok: false, motivo: 'Na sexta-feira o acesso é das 07:00 às 16:00.' };
    }
  } else if (totalMin < inicio || totalMin >= fimNorm) {
    return { ok: false, motivo: 'De segunda a quinta o acesso é das 07:00 às 18:00.' };
  }
  return { ok: true };
}

function loadUsuarios() {
  try {
    const versao = localStorage.getItem('zkUsuariosVersion');
    if (versao !== USUARIOS_VERSION) {
      saveUsuarios(USUARIOS_PADRAO);
      localStorage.setItem('zkUsuariosVersion', USUARIOS_VERSION);
      return USUARIOS_PADRAO;
    }
    const raw = localStorage.getItem('zkUsuarios');
    if (raw) {
      const ensured = ensureUsuariosPadrao(JSON.parse(raw));
      saveUsuarios(ensured);
      return ensured;
    }
  } catch {}
  saveUsuarios(USUARIOS_PADRAO);
  localStorage.setItem('zkUsuariosVersion', USUARIOS_VERSION);
  return USUARIOS_PADRAO;
}

function saveUsuarios(lista) {
  localStorage.setItem('zkUsuarios', JSON.stringify(lista));
}

function ensureUsuariosPadrao(lista) {
  const atuais = Array.isArray(lista) ? [...lista] : [];

  for (const padrao of USUARIOS_PADRAO) {
    const idx = atuais.findIndex((u) => u.email === padrao.email);
    if (idx === -1) {
      atuais.push({ ...padrao });
      continue;
    }

    const atual = atuais[idx] || {};
    atuais[idx] = {
      ...padrao,
      ...atual,
      senha: atual.senha || padrao.senha,
    };
  }

  return atuais;
}

function mapApiUser(user) {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome || user.name,
    perfil: user.perfil || user.role,
    restricaoHorario: user.restricaoHorario ?? user.restrictBusiness ?? false,
    senha: '',
    ativo: user.active ?? true,
  };
}

async function loginViaApi(email, senha) {
  const tryEmails = [email];
  if (email.endsWith('@zenith.com')) {
    tryEmails.push(email.replace('@zenith.com', '@zenith.local'));
  }

  for (const tryEmail of tryEmails) {
    const resp = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: tryEmail, password: senha }),
    });

    if (resp.ok && resp.data?.ok && resp.data?.token && resp.data?.user) {
      return {
        ok: true,
        token: resp.data.token,
        user: mapApiUser(resp.data.user),
      };
    }
  }

  return { ok: false };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('zkuser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [error, setError] = useState(null);
  const [sessaoBloqueadaPor, setSessaoBloqueadaPor] = useState(null);
  const [kickedMessage, setKickedMessage] = useState(null);
  const [usuarios, setUsuariosState] = useState(loadUsuarios);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const INATIVIDADE_LIMIT = 20 * 60 * 1000;
  const ATIVIDADE_KEY = 'zkLastActivity';

  const refreshUsuariosFromApi = useCallback(async () => {
    const currentToken = getStoredToken();
    const currentUser = userRef.current;
    if (!currentToken || !currentUser || (currentUser.perfil !== 'ADMIN' && currentUser.perfil !== 'TI')) return;

    const resp = await apiRequest('/api/users');
    if (resp.ok && resp.data?.ok && Array.isArray(resp.data.data)) {
      const localList = loadUsuarios();
      const merged = resp.data.data
        .filter((u) => (u.perfil || u.role) !== 'VISITANTE')
        .map((u) => {
          const local = localList.find((x) => x.email === u.email);
          return {
            ...mapApiUser(u),
            senha: local?.senha || '',
          };
        });
      const ensured = ensureUsuariosPadrao(merged);
      saveUsuarios(ensured);
      setUsuariosState(ensured);
    }
  }, []);

  function registrarAtividade() {
    localStorage.setItem(ATIVIDADE_KEY, Date.now().toString());
  }

  useEffect(() => {
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => registrarAtividade();
    eventos.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    registrarAtividade();
    return () => eventos.forEach((e) => window.removeEventListener(e, handler));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      const last = Number(localStorage.getItem(ATIVIDADE_KEY) || Date.now());
      if (Date.now() - last > INATIVIDADE_LIMIT) {
        if (currentUser.perfil !== 'ADMIN') {
          const sessao = getSessaoAtiva();
          if (sessao && sessao.id === currentUser.id) setSessaoAtiva(null);
        }
        setStoredToken('');
        setUser(null);
        localStorage.removeItem('zkuser');
        setKickedMessage('⏰ Você foi desconectado por inatividade (20 minutos sem atividade).');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = userRef.current;
      if (!currentUser || currentUser.perfil === 'ADMIN' || currentUser.perfil === 'TI') return;
      const kick = getKickSignal();
      if (kick && kick.targetSessionId === currentUser.sessionId) {
        clearKickSignal();
        setSessaoAtiva(null);
        setStoredToken('');
        setUser(null);
        localStorage.removeItem('zkuser');
        setKickedMessage(`⚠️ Sua sessão foi encerrada pelo Administrador (${kick.by}). Você foi desconectado.`);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.perfil === 'ADMIN' || user?.perfil === 'TI') {
      refreshUsuariosFromApi();
    }
  }, [user?.perfil, refreshUsuariosFromApi]);

  async function login(email, senha) {
    setError(null);
    setSessaoBloqueadaPor(null);
    setKickedMessage(null);

    const lista = loadUsuarios();
    const localFound = lista.find((u) => u.email === email && u.senha === senha);
    const localLike = lista.find((u) => u.email === email);

    if (localLike?.restricaoHorario) {
      const h = verificarHorarioComercial();
      if (!h.ok) {
        setError(`Fora do horário comercial. ${h.motivo}`);
        return false;
      }
    }

    const sessao = getSessaoAtiva();

    const apiLogin = await loginViaApi(email, senha);
    let found = null;
    let token = '';

    if (apiLogin.ok) {
      found = apiLogin.user;
      token = apiLogin.token;

      const saved = loadUsuarios();
      if (!saved.some((u) => u.email === found.email)) {
        const merge = [...saved, { ...found, senha: '' }];
        saveUsuarios(merge);
        setUsuariosState(merge);
      }
    } else if (localFound) {
      found = {
        id: localFound.id,
        email: localFound.email,
        nome: localFound.nome,
        perfil: localFound.perfil,
        restricaoHorario: localFound.restricaoHorario ?? false,
      };
    }

    if (!found) {
      setError('E-mail ou senha inválidos.');
      return false;
    }

    if (found.perfil === 'ADMIN') {
      if (sessao) {
        enviarSinalKick(sessao.sessionId, found.nome);
        setSessaoAtiva(null);
      }
    } else if (found.perfil !== 'VISITANTE' && found.perfil !== 'TI') {
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
      id: found.id,
      email: found.email,
      nome: found.nome,
      perfil: found.perfil,
      restricaoHorario: found.restricaoHorario ?? false,
      sessionId,
    };

    if (token) setStoredToken(token);

    setUser(userData);
    localStorage.setItem('zkuser', JSON.stringify(userData));

    if (found.perfil !== 'ADMIN' && found.perfil !== 'VISITANTE' && found.perfil !== 'TI') {
      setSessaoAtiva(userData);
    }

    return true;
  }

  function logout() {
    const currentUser = userRef.current;
    if (currentUser && currentUser.perfil !== 'ADMIN') {
      const sessao = getSessaoAtiva();
      if (sessao && sessao.id === currentUser.id) setSessaoAtiva(null);
    }
    setStoredToken('');
    setUser(null);
    localStorage.removeItem('zkuser');
  }

  function criarUsuario(dados) {
    const lista = loadUsuarios();
    const nextId = Math.max(0, ...lista.map((u) => u.id)) + 1;
    const novo = { ...dados, id: nextId };
    const nova = [...lista, novo];
    saveUsuarios(nova);
    setUsuariosState(nova);

    apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: dados.email,
        name: dados.nome,
        password: dados.senha,
        role: dados.perfil,
        active: true,
        restrictBusiness: dados.restricaoHorario ?? false,
      }),
    }).then(() => refreshUsuariosFromApi());
  }

  function editarUsuario(id, dados) {
    const lista = loadUsuarios();
    const nova = lista.map((u) => (u.id === id ? { ...u, ...dados } : u));
    saveUsuarios(nova);
    setUsuariosState(nova);

    if (user?.id === id) {
      const at = nova.find((u) => u.id === id);
      if (at) {
        const sess = {
          id: at.id,
          email: at.email,
          nome: at.nome,
          perfil: at.perfil,
          restricaoHorario: at.restricaoHorario,
          sessionId: user.sessionId,
        };
        setUser(sess);
        localStorage.setItem('zkuser', JSON.stringify(sess));
      }
    }

    const body = {
      name: dados.nome,
      role: dados.perfil,
      active: dados.ativo ?? true,
      restrictBusiness: dados.restricaoHorario ?? false,
    };
    if (dados.senha) body.password = dados.senha;

    apiRequest(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(() => refreshUsuariosFromApi());
  }

  function excluirUsuario(id) {
    if (user?.id === id) return;
    const lista = loadUsuarios();
    const nova = lista.filter((u) => u.id !== id);
    saveUsuarios(nova);
    setUsuariosState(nova);

    apiRequest(`/api/users/${id}`, { method: 'DELETE' }).then(() => refreshUsuariosFromApi());
  }

  const isVisitante = user?.perfil === 'VISITANTE';
  const can = {
    verDashboard:         user && ['ADMIN', 'TI', 'VISITANTE'].includes(user.perfil),
    verProdutos:          !!user,
    editarProdutos:       !isVisitante && user && ['ADMIN', 'TI', 'EXPEDICAO'].includes(user.perfil),
    excluirProdutos:      !isVisitante && user && ['ADMIN', 'TI'].includes(user.perfil),
    fazerMovimentacoes:   !isVisitante && user && ['ADMIN', 'TI', 'EXPEDICAO'].includes(user.perfil),
    verHistorico:         user && ['ADMIN', 'TI', 'EXPEDICAO', 'SUPERVISAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil),
    verAlertas:           user && ['ADMIN', 'TI', 'COMPRAS', 'EXPEDICAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil),
    verPendentes:         user && ['ADMIN', 'TI', 'EXPEDICAO', 'COMPRAS', 'PRODUCAO', 'VISITANTE'].includes(user.perfil),
    verAuditoria:         user && ['ADMIN', 'TI', 'VISITANTE'].includes(user.perfil),
    verEntrada:           user && ['ADMIN', 'TI', 'EXPEDICAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil),
    confirmarEntrada:     !isVisitante && user && ['ADMIN', 'TI', 'EXPEDICAO'].includes(user.perfil),
    marcarPedido:         !isVisitante && user && ['ADMIN', 'TI', 'COMPRAS'].includes(user.perfil),
    verSugestoes:         !!user,
    gerenciarUsuarios:    !isVisitante && user && ['ADMIN', 'TI'].includes(user.perfil),
    verPrecos:            user && ['ADMIN', 'TI', 'SUPERVISAO', 'COMERCIAL', 'COMPRAS', 'VISITANTE'].includes(user.perfil),
    editarPrecos:         !isVisitante && user && ['ADMIN', 'TI', 'SUPERVISAO'].includes(user.perfil),
    verMidia:             user && ['ADMIN', 'TI', 'SUPERVISAO', 'COMERCIAL', 'VISITANTE'].includes(user.perfil),
    verSeparacoes:        user && ['ADMIN', 'TI', 'EXPEDICAO', 'COMERCIAL', 'SUPERVISAO', 'PRODUCAO', 'VISITANTE'].includes(user.perfil),
    criarSeparacao:       !isVisitante && user && ['ADMIN', 'TI', 'COMERCIAL'].includes(user.perfil),
    avancarSeparacao:     !isVisitante && user && ['ADMIN', 'TI', 'EXPEDICAO', 'PRODUCAO'].includes(user.perfil),
    editarSeparacao:      !isVisitante && user && ['ADMIN', 'TI'].includes(user.perfil),
    cancelarSeparacao:    !isVisitante && user && ['ADMIN', 'TI'].includes(user.perfil),
    verChat:              !!user && !isVisitante,
    verChatTotal:         user?.perfil === 'ADMIN' || user?.perfil === 'TI',
    verCubagem:           user && ['ADMIN', 'TI', 'SUPERVISAO', 'COMERCIAL', 'VISITANTE'].includes(user.perfil),
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      error,
      can,
      sessaoBloqueadaPor,
      kickedMessage,
      setKickedMessage,
      usuarios,
      PERFIS,
      criarUsuario,
      editarUsuario,
      excluirUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
