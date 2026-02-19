// Contexto de autenticação com suporte a gerenciamento de usuários via localStorage
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const USUARIOS_PADRAO = [
  { id: 1, email: 'admin@zenith.com',       senha: '123456', nome: 'Administrador',         perfil: 'ADMIN' },
  { id: 2, email: 'gerencia@zenith.com',    senha: '123456', nome: 'Gerência Comercial',     perfil: 'GERENCIA' },
  { id: 3, email: 'expedicao@zenith.com',   senha: '123456', nome: 'Expedição',              perfil: 'EXPEDICAO' },
  { id: 4, email: 'vendedora@zenith.com',   senha: '123456', nome: 'Vendedora',              perfil: 'VENDEDORA' },
  { id: 5, email: 'supervisao@zenith.com',  senha: '123456', nome: 'Supervisão Comercial',   perfil: 'SUPERVISAO' },
];

export const PERFIS = ['ADMIN', 'GERENCIA', 'EXPEDICAO', 'SUPERVISAO', 'VENDEDORA'];

function loadUsuarios() {
  try {
    const raw = localStorage.getItem('zkUsuarios');
    if (raw) return JSON.parse(raw);
  } catch {}
  return USUARIOS_PADRAO;
}

function saveUsuarios(lista) {
  localStorage.setItem('zkUsuarios', JSON.stringify(lista));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('zkuser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [error, setError] = useState(null);
  const [usuarios, setUsuariosState] = useState(loadUsuarios);

  function login(email, senha) {
    setError(null);
    const lista = loadUsuarios();
    const found = lista.find(u => u.email === email && u.senha === senha);
    if (found) {
      const userData = { id: found.id, email: found.email, nome: found.nome, perfil: found.perfil };
      setUser(userData);
      localStorage.setItem('zkuser', JSON.stringify(userData));
      return true;
    } else {
      setError('E-mail ou senha inválidos');
      return false;
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('zkuser');
  }

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
      const atualizado = nova.find(u => u.id === id);
      if (atualizado) {
        const sess = { id: atualizado.id, email: atualizado.email, nome: atualizado.nome, perfil: atualizado.perfil };
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

  const can = {
    editarProdutos:     user && ['ADMIN'].includes(user.perfil),
    fazerMovimentacoes: user && ['ADMIN', 'EXPEDICAO', 'SUPERVISAO'].includes(user.perfil),
    verAuditoria:       user && ['ADMIN', 'GERENCIA', 'SUPERVISAO'].includes(user.perfil),
    verRelatorios:      user && ['ADMIN', 'GERENCIA', 'SUPERVISAO'].includes(user.perfil),
    verAlertas:         user && ['ADMIN', 'GERENCIA', 'EXPEDICAO', 'SUPERVISAO'].includes(user.perfil),
    gerenciarUsuarios:  user && ['ADMIN'].includes(user.perfil),
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, error, can,
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
