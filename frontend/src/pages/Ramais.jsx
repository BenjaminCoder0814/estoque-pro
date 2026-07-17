// Ramais.jsx — Anotação compartilhada dos ramais internos.
// Todos os logins podem ver e editar. Sincronizado em tempo real via Firestore
// (config/ramais) e com cache local em zkRamais.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LucidePhone, LucidePlus, LucideEdit2, LucideTrash2, LucideCheck,
  LucideX, LucideSearch, LucideSave, LucideRotateCcw,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { gerarMsgId } from './chat/chatHelpers';

const RAMAIS_DOC = 'config/ramais';
const CACHE_KEY = 'zkRamais';

// Lista inicial (sincronizada com a anotação física)
const RAMAIS_INICIAIS = [
  // Internos
  { id: 'r_209', numero: '209', nome: 'Bia', tipo: 'interno' },
  { id: 'r_218', numero: '218', nome: 'Expedição', tipo: 'interno' },
  { id: 'r_203', numero: '203', nome: 'Kelly', tipo: 'interno' },
  { id: 'r_222', numero: '222', nome: 'Duda', tipo: 'interno' },
  { id: 'r_221', numero: '221', nome: 'Larissa', tipo: 'interno' },
  { id: 'r_208', numero: '208', nome: 'Sobrinha', tipo: 'interno' },
  { id: 'r_207', numero: '207', nome: 'Paula', tipo: 'interno' },
  { id: 'r_206', numero: '206', nome: 'Rafaela', tipo: 'interno' },
  { id: 'r_215', numero: '215', nome: 'Richard', tipo: 'interno' },
  { id: 'r_213', numero: '213', nome: 'Gabriela', tipo: 'interno' },
  { id: 'r_204', numero: '204', nome: 'Anna Paula — sala comercial', tipo: 'interno' },
  { id: 'r_212', numero: '212', nome: 'Benjamin — TI', tipo: 'interno' },
  // Externos
  { id: 'r_304', numero: '304', nome: 'Paulinha', tipo: 'externo' },
  { id: 'r_301', numero: '301', nome: 'Richard', tipo: 'externo' },
];

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function Ramais() {
  const { user } = useAuth();
  const [data, setData] = useState(() =>
    loadCache() || { ramais: RAMAIS_INICIAIS, updatedAt: 0 }
  );
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('interno'); // 'interno' | 'externo'
  const [editandoId, setEditandoId] = useState(null);
  const [editNumero, setEditNumero] = useState('');
  const [editNome, setEditNome] = useState('');
  const [novoNumero, setNovoNumero] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const skipNextRef = useRef(false);
  const lastSyncedAtRef = useRef(0);

  // Subscrição Firestore (compartilhada por TODOS)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, ...RAMAIS_DOC.split('/')), (snap) => {
      if (!snap.exists()) return;
      const remote = snap.data();
      if (skipNextRef.current && remote.updatedAt === lastSyncedAtRef.current) {
        skipNextRef.current = false;
        return;
      }
      if (Array.isArray(remote.ramais)) {
        // Migração: garante que ramais antigos sem tipo virem 'interno'
        // e que os externos padrão (304, 301) existam ao menos uma vez.
        let migrado = remote.ramais.map(r => ({ ...r, tipo: r.tipo || 'interno' }));
        if (!remote.externosSeed) {
          const numerosExistentes = new Set(migrado.map(r => r.numero));
          const externosPadrao = RAMAIS_INICIAIS.filter(r => r.tipo === 'externo');
          externosPadrao.forEach(ex => {
            if (!numerosExistentes.has(ex.numero)) migrado.push(ex);
          });
          const payload = {
            ...remote,
            ramais: migrado,
            externosSeed: true,
            updatedAt: Date.now(),
          };
          skipNextRef.current = true;
          lastSyncedAtRef.current = payload.updatedAt;
          setData(payload);
          saveCache(payload);
          setDoc(doc(db, ...RAMAIS_DOC.split('/')), payload)
            .catch(e => console.warn('Ramais migração:', e?.message));
          return;
        }
        const next = { ...remote, ramais: migrado };
        setData(next);
        saveCache(next);
      }
    }, (err) => console.warn('Ramais onSnapshot:', err?.message));
    return () => unsub();
  }, []);

  const persistir = useCallback((novoArr) => {
    const payload = {
      ramais: novoArr,
      updatedAt: Date.now(),
      updatedBy: user?.nome || 'desconhecido',
      externosSeed: true,
    };
    setData(payload);
    saveCache(payload);
    skipNextRef.current = true;
    lastSyncedAtRef.current = payload.updatedAt;
    setDoc(doc(db, ...RAMAIS_DOC.split('/')), payload)
      .catch(e => console.warn('Ramais setDoc:', e?.message));
  }, [user]);

  // Restaura a lista padrão (sem destruir o resto)
  const restaurarPadrao = () => {
    if (!confirm('Restaurar a lista inicial de ramais? Isto vai substituir a lista atual.')) return;
    persistir(RAMAIS_INICIAIS);
  };

  // Conta itens por aba (sem aplicar filtro de busca)
  const contagem = useMemo(() => {
    const arr = data.ramais || [];
    let interno = 0, externo = 0;
    arr.forEach(r => {
      if ((r.tipo || 'interno') === 'externo') externo++;
      else interno++;
    });
    return { interno, externo };
  }, [data]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const arr = (data.ramais || []).filter(r => (r.tipo || 'interno') === aba);
    const filtrado = q
      ? arr.filter(r =>
          (r.numero || '').toLowerCase().includes(q) ||
          (r.nome || '').toLowerCase().includes(q))
      : arr;
    return [...filtrado].sort((a, b) =>
      (a.numero || '').localeCompare(b.numero || '', 'pt-BR', { numeric: true })
    );
  }, [data, busca, aba]);

  const iniciarEdicao = (r) => {
    setEditandoId(r.id);
    setEditNumero(r.numero || '');
    setEditNome(r.nome || '');
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditNumero('');
    setEditNome('');
  };

  const salvarEdicao = () => {
    const num = editNumero.trim();
    const nome = editNome.trim();
    if (!num || !nome) {
      alert('Preencha número e nome.');
      return;
    }
    const novo = (data.ramais || []).map(r =>
      r.id === editandoId ? { ...r, numero: num, nome } : r
    );
    persistir(novo);
    cancelarEdicao();
  };

  const excluir = (id) => {
    const r = (data.ramais || []).find(x => x.id === id);
    if (!r) return;
    if (!confirm(`Remover o ramal ${r.numero} (${r.nome})?`)) return;
    persistir((data.ramais || []).filter(x => x.id !== id));
  };

  const adicionarNovo = () => {
    const num = novoNumero.trim();
    const nome = novoNome.trim();
    if (!num || !nome) {
      alert('Informe número e nome do ramal.');
      return;
    }
    if ((data.ramais || []).some(r => r.numero === num)) {
      if (!confirm(`Já existe um ramal ${num}. Deseja adicionar mesmo assim?`)) return;
    }
    const novo = [...(data.ramais || []), { id: 'r_' + gerarMsgId(), numero: num, nome, tipo: aba }];
    persistir(novo);
    setNovoNumero('');
    setNovoNome('');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-900 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <LucidePhone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Ramais</h1>
              <p className="text-xs text-slate-400">
                Lista compartilhada — edição liberada para todos os logins
              </p>
            </div>
          </div>
          <button
            onClick={restaurarPadrao}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
            title="Restaurar lista inicial"
          >
            <LucideRotateCcw className="w-3.5 h-3.5" />
            Restaurar padrão
          </button>
        </div>

        {/* Abas Internos / Externos */}
        <div className="flex gap-2 mb-3 bg-slate-800/60 border border-white/10 rounded-xl p-1">
          {[
            { key: 'interno', label: 'Internos', count: contagem.interno },
            { key: 'externo', label: 'Externos', count: contagem.externo },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                aba === t.key
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                aba === t.key ? 'bg-white/20' : 'bg-white/10 text-slate-400'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative mb-3">
          <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número ou nome…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Lista */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/10">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5 w-24">Ramal</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5">Nome</th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-4 py-2.5 w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-500 text-sm">
                    Nenhum ramal encontrado.
                  </td>
                </tr>
              ) : lista.map((r, idx) => {
                const editando = editandoId === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`group border-b border-white/5 transition ${
                      editando ? 'bg-indigo-500/10' : idx % 2 ? 'bg-slate-800/40' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {editando ? (
                        <input
                          autoFocus
                          value={editNumero}
                          onChange={e => setEditNumero(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-20 bg-slate-700/80 border border-indigo-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                          maxLength={6}
                        />
                      ) : (
                        <span className="font-mono text-sm font-bold text-indigo-300">{r.numero}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {editando ? (
                        <input
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full bg-slate-700/80 border border-indigo-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm text-white">{r.nome}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editando ? (
                          <>
                            <button
                              onClick={salvarEdicao}
                              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition"
                              title="Salvar"
                            >
                              <LucideCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                              title="Cancelar"
                            >
                              <LucideX className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => iniciarEdicao(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
                              title="Editar"
                            >
                              <LucideEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => excluir(r.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition opacity-0 group-hover:opacity-100"
                              title="Excluir"
                            >
                              <LucideTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Adicionar novo */}
        <div className="mt-4 bg-slate-800/60 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <LucidePlus className="w-4 h-4 text-indigo-300" />
            <span className="text-sm font-semibold text-white">
              Adicionar novo ramal {aba === 'externo' ? 'externo' : 'interno'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ramal (ex.: 210)"
              value={novoNumero}
              onChange={e => setNovoNumero(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarNovo()}
              className="sm:w-32 bg-slate-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              maxLength={6}
            />
            <input
              type="text"
              placeholder="Nome / setor"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarNovo()}
              className="flex-1 bg-slate-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={adicionarNovo}
              disabled={!novoNumero.trim() || !novoNome.trim()}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                novoNumero.trim() && novoNome.trim()
                  ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <LucidePlus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-3 text-center text-[10px] text-slate-500">
          {data.updatedAt
            ? `Última atualização: ${new Date(data.updatedAt).toLocaleString('pt-BR')}${data.updatedBy ? ` por ${data.updatedBy}` : ''}`
            : 'Lista inicial — ainda não editada'}
        </div>
      </div>
    </div>
  );
}
