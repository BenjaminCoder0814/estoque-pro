// Página de gerenciamento de usuários — visível apenas para ADMIN
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LucideUserPlus, LucidePencil, LucideTrash2, LucideCheck, LucideX, LucideShieldCheck } from 'lucide-react';

const PERFIL_CORES = {
  ADMIN:      'bg-purple-100 text-purple-700 border-purple-200',
  GERENCIA:   'bg-blue-100 text-blue-700 border-blue-200',
  EXPEDICAO:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  SUPERVISAO: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  VENDEDORA:  'bg-pink-100 text-pink-700 border-pink-200',
};

const FORM_VAZIO = { nome: '', email: '', senha: '', perfil: 'EXPEDICAO' };

export default function GerenciarUsuarios() {
  const { usuarios, PERFIS, criarUsuario, editarUsuario, excluirUsuario, user } = useAuth();

  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState(null);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  function flash(tipo, texto) {
    if (tipo === 'ok') { setMsg(texto); setErro(''); setTimeout(() => setMsg(''), 3500); }
    else               { setErro(texto); setMsg(''); setTimeout(() => setErro(''), 4000); }
  }

  function iniciarEdicao(u) {
    setEditandoId(u.id);
    setForm({ nome: u.nome, email: u.email, senha: u.senha, perfil: u.perfil });
    setConfirmarExcluir(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      flash('err', 'Preencha todos os campos obrigatórios.');
      return;
    }
    // Verifica e-mail duplicado (exceto o próprio na edição)
    const emailUsado = usuarios.find(u => u.email === form.email && u.id !== editandoId);
    if (emailUsado) { flash('err', 'Este e-mail já está cadastrado.'); return; }

    if (editandoId) {
      editarUsuario(editandoId, form);
      flash('ok', 'Usuário atualizado com sucesso!');
    } else {
      criarUsuario(form);
      flash('ok', 'Novo usuário criado com sucesso!');
    }
    cancelarEdicao();
  }

  function confirmarDelete(id) {
    if (id === user?.id) { flash('err', 'Você não pode excluir a si mesmo.'); return; }
    setConfirmarExcluir(id);
  }

  function executarDelete(id) {
    excluirUsuario(id);
    setConfirmarExcluir(null);
    flash('ok', 'Usuário excluído.');
  }

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <LucideShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gerenciar Usuários</h1>
          <p className="text-sm text-slate-400">Adicione, edite ou remova contas do sistema</p>
        </div>
      </div>

      {/* Mensagens */}
      {msg  && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">✓ {msg}</div>}
      {erro && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">✕ {erro}</div>}

      {/* Formulário novo / edição */}
      <div className="bg-white rounded-2xl shadow-card border border-indigo-100 p-6 mb-6 animate-slideup">
        <h2 className="text-base font-bold mb-4 text-slate-700 flex items-center gap-2">
          <span className="w-2 h-5 rounded bg-gradient-to-b from-indigo-500 to-purple-500 inline-block"></span>
          {editandoId ? 'Editar Usuário' : 'Novo Usuário'}
        </h2>
        <form onSubmit={salvar} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Nome *</label>
            <input
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-52 outline-none focus:border-indigo-400"
              placeholder="Nome completo"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">E-mail *</label>
            <input
              type="email"
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-56 outline-none focus:border-indigo-400"
              placeholder="email@empresa.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Senha *</label>
            <div className="relative flex items-center">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-40 outline-none focus:border-indigo-400 pr-10"
                placeholder="••••••"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                required
              />
              <button type="button" className="absolute right-2 text-slate-400 hover:text-indigo-500 text-xs" onClick={() => setMostrarSenha(v => !v)}>
                {mostrarSenha ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Perfil *</label>
            <select
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              value={form.perfil}
              onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}
            >
              {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-white text-sm shadow-glow transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
            >
              <LucideCheck className="w-4 h-4" />
              {editandoId ? 'Salvar' : 'Criar'}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicao}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-slate-600 text-sm bg-slate-100 hover:bg-slate-200 transition"
              >
                <LucideX className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white rounded-2xl shadow-card border border-indigo-50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-700">{usuarios.length} usuário(s) cadastrado(s)</span>
          <button
            onClick={() => { setEditandoId(null); setForm(FORM_VAZIO); }}
            className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition"
          >
            <LucideUserPlus className="w-4 h-4" /> Novo usuário
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-center">Perfil</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className={`border-t border-slate-50 text-sm hover:bg-indigo-50/30 transition ${u.id === user?.id ? 'bg-indigo-50/60' : ''}`}>
                <td className="p-3 font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.nome?.charAt(0)?.toUpperCase()}
                  </div>
                  {u.nome}
                  {u.id === user?.id && <span className="text-[10px] text-indigo-500 bg-indigo-100 rounded px-1">você</span>}
                </td>
                <td className="p-3 text-slate-500">{u.email}</td>
                <td className="p-3 text-center">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border capitalize ${PERFIL_CORES[u.perfil] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {u.perfil}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => iniciarEdicao(u)}
                      className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition"
                      title="Editar"
                    >
                      <LucidePencil className="w-4 h-4" />
                    </button>
                    {u.id !== user?.id && (
                      confirmarExcluir === u.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => executarDelete(u.id)} className="text-xs text-red-600 font-bold px-2 py-1 bg-red-100 rounded-lg hover:bg-red-200 transition">Confirmar</button>
                          <button onClick={() => setConfirmarExcluir(null)} className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition">Cancelar</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => confirmarDelete(u.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 transition"
                          title="Excluir"
                        >
                          <LucideTrash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
