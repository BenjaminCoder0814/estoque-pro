// Contexto de autenticação com controle de horário comercial e sessão única
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// ──────────────────────────────────────────────
// USUÁRIOS DO SISTEMA
// ──────────────────────────────────────────────
const USUARIOS_PADRAO = [
  { id: 1, email: 'admin@zenith.com',      senha: '123456',    nome: 'Administrador', perfil: 'ADMIN',      restricaoHorario: false },
  { id: 2, email: 'expedicao@zenith.com',  senha: 'exped2026', nome: 'Expedição',     perfil: 'EXPEDICAO',  restricaoHorario: true  },
  { id: 3, email: 'compras@zenith.com',    senha: 'lari2026',  nome: 'Compras',       perfil: 'COMPRAS',    restricaoHorario: true  },
  { id: 4, email: 'supervisao@zenith.com', senha: 'super2026', nome: 'Supervisão',    perfil: 'SUPERVISAO', restricaoHorario: true  },
  { id: 5, email: 'comercial@zenith.com',  senha: 'com2026',   nome: 'Comercial',     perfil: 'COMERCIAL',  restricaoHorario: true  },
];

export const PERFIS = ['ADMIN', 'EXPEDICAO', 'COMPRAS', 'SUPERVISAO', 'COMERCIAL'];

// ──────────────────────────────────────────────
// SESSÃO ATIVA (controle de acesso único não-admin)
// ──────────────────────────────────────────────
const SESSAO_KEY = 'zkSessaoAtiva';

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
    }));
  } else {
    localStorage.removeItem(SESSAO_KEY);
  }
}

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
const USUARIOS_VERSION = 'v2'; // Incremente para forçar reset dos usuários padrão

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

  const [error, setError]                       = useState(null);
  const [sessaoBloqueadaPor, setSessaoBloqueadaPor] = useState(null);
  const [usuarios, setUsuariosState]            = useState(loadUsuarios);

  // ── LOGIN ──────────────────────────────────
  function login(email, senha) {
    setError(null);
    setSessaoBloqueadaPor(null);
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

    // Controle de sessão única: só 1 não-admin por vez (admin pode sempre)
    if (found.perfil !== 'ADMIN') {
      const sessao = getSessaoAtiva();
      if (sessao && sessao.id !== found.id) {
        setSessaoBloqueadaPor(sessao.nome);
        setError(
          `⛔ Acesso bloqueado! O usuário "${sessao.nome}" está utilizando o sistema no momento. ` +
          `Apenas um acesso é permitido por vez.`
        );
        return false;
      }
    }

    const userData = {
      id: found.id, email: found.email, nome: found.nome,
      perfil: found.perfil, restricaoHorario: found.restricaoHorario ?? false,
    };

    setUser(userData);
    localStorage.setItem('zkuser', JSON.stringify(userData));

    // Registra sessão ativa apenas para não-admin
    if (found.perfil !== 'ADMIN') setSessaoAtiva(userData);

    return true;
  }

  // ── LOGOUT ─────────────────────────────────
  function logout() {
    if (user && user.perfil !== 'ADMIN') {
      const sessao = getSessaoAtiva();
      if (sessao && sessao.id === user.id) setSessaoAtiva(null);
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
  // ADMIN:      tudo, qualquer hora
  // EXPEDICAO:  editar produtos, ver histórico, ver alertas, confirmar entradas
  // COMPRAS:    somente ver alertas + marcar pedidos + ver produtos
  // SUPERVISAO: ver produtos, histórico, alertas, dashboard
  // COMERCIAL:  somente visualização de produtos
  const can = {
    verDashboard:         user && ['ADMIN', 'SUPERVISAO'].includes(user.perfil),
    verProdutos:          !!user,
    editarProdutos:       user && ['ADMIN', 'EXPEDICAO'].includes(user.perfil),
    excluirProdutos:      user && ['ADMIN'].includes(user.perfil),
    fazerMovimentacoes:   user && ['ADMIN', 'EXPEDICAO'].includes(user.perfil),
    verHistorico:         user && ['ADMIN', 'EXPEDICAO', 'SUPERVISAO'].includes(user.perfil),
    verAlertas:           user && ['ADMIN', 'EXPEDICAO', 'SUPERVISAO', 'COMPRAS'].includes(user.perfil),
    verAuditoria:         user && ['ADMIN'].includes(user.perfil),
    verEntrada:           user && ['ADMIN', 'EXPEDICAO'].includes(user.perfil),
    confirmarEntrada:     user && ['ADMIN', 'EXPEDICAO'].includes(user.perfil),
    marcarPedido:         user && ['COMPRAS'].includes(user.perfil),
    verSugestoes:         !!user,
    gerenciarUsuarios:    user && ['ADMIN'].includes(user.perfil),
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, error, can,
      sessaoBloqueadaPor,
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
