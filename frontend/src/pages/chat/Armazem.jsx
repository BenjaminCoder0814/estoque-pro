// Armazem.jsx — "Armazém Próprio" de cada login no chat SIZ.
// Funciona como um bloco de notas pessoal com pastas (cada login só vê o seu).
// Persistência: Firestore (chat_armazem/{userId}) + cache localStorage (zkArmazem_{userId}).

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LucideFolder, LucideFolderPlus, LucideEdit2, LucideTrash2, LucidePlus,
  LucidePaperclip, LucideFile, LucideImage, LucideDownload, LucideX,
  LucideSearch, LucidePackage, LucideChevronLeft, LucideStickyNote,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { iconeArquivo, formatTs, gerarMsgId } from './chatHelpers';

const ARMAZEM_COL = 'chat_armazem';
const cacheKey = (uid) => `zkArmazem_${uid}`;

function loadCache(uid) {
  try { return JSON.parse(localStorage.getItem(cacheKey(uid)) || 'null'); }
  catch { return null; }
}
function saveCache(uid, data) {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(data)); } catch {}
}

function novaPasta(nome) {
  return {
    id: 'p_' + gerarMsgId(),
    nome: nome || 'Nova pasta',
    items: [],
    criadaEm: Date.now(),
  };
}

function estadoInicial() {
  return {
    pastas: [
      { id: 'p_geral', nome: 'Geral', items: [], criadaEm: Date.now() },
    ],
    updatedAt: Date.now(),
  };
}

export default function Armazem({ user, onVoltar }) {
  const uid = user?.id;
  const [data, setData] = useState(() => loadCache(uid) || estadoInicial());
  const [pastaAtivaId, setPastaAtivaId] = useState(() => data.pastas?.[0]?.id || 'p_geral');
  const [novoTexto, setNovoTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [editandoPastaId, setEditandoPastaId] = useState(null);
  const [editandoPastaNome, setEditandoPastaNome] = useState('');
  const [editandoItemId, setEditandoItemId] = useState(null);
  const [editandoItemTexto, setEditandoItemTexto] = useState('');
  const fileInputRef = useRef(null);
  const skipNextSyncRef = useRef(false);
  const lastSyncedAtRef = useRef(0);

  // Realtime Firestore
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, ARMAZEM_COL, String(uid)), (snap) => {
      if (snap.exists()) {
        const remote = snap.data();
        // Se este client acabou de escrever, ignora o eco
        if (skipNextSyncRef.current && remote.updatedAt === lastSyncedAtRef.current) {
          skipNextSyncRef.current = false;
          return;
        }
        if (remote.updatedAt && remote.updatedAt >= (data.updatedAt || 0)) {
          setData(remote);
          saveCache(uid, remote);
          if (!remote.pastas?.some(p => p.id === pastaAtivaId)) {
            setPastaAtivaId(remote.pastas?.[0]?.id || 'p_geral');
          }
        }
      }
    }, (err) => console.warn('Armazem onSnapshot:', err?.message));
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Persiste em cache + Firestore
  const persistir = useCallback((novo) => {
    const payload = { ...novo, userId: uid, updatedAt: Date.now() };
    setData(payload);
    saveCache(uid, payload);
    skipNextSyncRef.current = true;
    lastSyncedAtRef.current = payload.updatedAt;
    setDoc(doc(db, ARMAZEM_COL, String(uid)), payload)
      .catch(e => console.warn('Armazem setDoc:', e?.message));
  }, [uid]);

  // ─────────── Pastas ───────────
  const criarPasta = () => {
    const nome = prompt('Nome da nova pasta:', '');
    if (!nome || !nome.trim()) return;
    const p = novaPasta(nome.trim());
    persistir({ ...data, pastas: [...(data.pastas || []), p] });
    setPastaAtivaId(p.id);
  };

  const renomearPasta = (pid) => {
    const nome = editandoPastaNome.trim();
    if (!nome) { setEditandoPastaId(null); return; }
    const pastas = data.pastas.map(p => p.id === pid ? { ...p, nome } : p);
    persistir({ ...data, pastas });
    setEditandoPastaId(null);
    setEditandoPastaNome('');
  };

  const excluirPasta = (pid) => {
    if (data.pastas.length <= 1) {
      alert('Você precisa manter pelo menos uma pasta.');
      return;
    }
    const pasta = data.pastas.find(p => p.id === pid);
    if (!pasta) return;
    if (!confirm(`Excluir a pasta "${pasta.nome}" e todos os seus ${pasta.items?.length || 0} item(ns)?`)) return;
    const pastas = data.pastas.filter(p => p.id !== pid);
    persistir({ ...data, pastas });
    if (pid === pastaAtivaId) setPastaAtivaId(pastas[0].id);
  };

  // ─────────── Itens ───────────
  const pastaAtiva = useMemo(
    () => data.pastas?.find(p => p.id === pastaAtivaId) || data.pastas?.[0],
    [data.pastas, pastaAtivaId]
  );

  const itensFiltrados = useMemo(() => {
    const items = pastaAtiva?.items || [];
    const q = busca.trim().toLowerCase();
    const list = q
      ? items.filter(i => (i.conteudo || '').toLowerCase().includes(q) || (i.fileName || '').toLowerCase().includes(q))
      : items;
    return [...list].sort((a, b) => (b.em || 0) - (a.em || 0));
  }, [pastaAtiva, busca]);

  const adicionarItem = (item) => {
    const pastas = data.pastas.map(p =>
      p.id === pastaAtivaId
        ? { ...p, items: [...(p.items || []), item] }
        : p
    );
    persistir({ ...data, pastas });
  };

  const removerItem = (iid) => {
    if (!confirm('Remover este item?')) return;
    const pastas = data.pastas.map(p =>
      p.id === pastaAtivaId
        ? { ...p, items: (p.items || []).filter(i => i.id !== iid) }
        : p
    );
    persistir({ ...data, pastas });
  };

  const moverItem = (iid, destinoId) => {
    if (destinoId === pastaAtivaId) return;
    let movido = null;
    const pastas = data.pastas.map(p => {
      if (p.id === pastaAtivaId) {
        const items = (p.items || []).filter(i => {
          if (i.id === iid) { movido = i; return false; }
          return true;
        });
        return { ...p, items };
      }
      return p;
    }).map(p => p.id === destinoId && movido ? { ...p, items: [...(p.items || []), movido] } : p);
    if (movido) persistir({ ...data, pastas });
  };

  const salvarEdicaoItem = () => {
    const txt = editandoItemTexto.trim();
    if (!txt) { setEditandoItemId(null); return; }
    const pastas = data.pastas.map(p =>
      p.id === pastaAtivaId
        ? {
            ...p,
            items: (p.items || []).map(i =>
              i.id === editandoItemId ? { ...i, conteudo: txt, editadoEm: Date.now() } : i
            ),
          }
        : p
    );
    persistir({ ...data, pastas });
    setEditandoItemId(null);
    setEditandoItemTexto('');
  };

  const enviarTexto = () => {
    const txt = novoTexto.trim();
    if (!txt) return;
    const isLink = /^(https?:\/\/|www\.)/i.test(txt);
    adicionarItem({
      id: gerarMsgId(),
      tipo: isLink ? 'link' : 'texto',
      conteudo: txt,
      em: Date.now(),
    });
    setNovoTexto('');
  };

  const enviarArquivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande (limite: 5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const isImg = file.type.startsWith('image/');
      adicionarItem({
        id: gerarMsgId(),
        tipo: isImg ? 'imagem' : 'arquivo',
        conteudo: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mime: file.type,
        em: Date.now(),
      });
    };
    reader.readAsDataURL(file);
  };

  // ─────────── RENDER ───────────
  if (!user) return null;

  return (
    <div className="flex-1 flex min-w-0 bg-slate-900">
      {/* Coluna pastas */}
      <aside className="w-60 flex-shrink-0 bg-slate-800/60 border-r border-white/10 flex flex-col">
        <div className="px-3 py-3 border-b border-white/10 flex items-center gap-2">
          <button
            onClick={onVoltar}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            title="Voltar"
          >
            <LucideChevronLeft className="w-5 h-5" />
          </button>
          <LucidePackage className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider flex-1">Pastas</span>
          <button
            onClick={criarPasta}
            className="p-1 rounded-lg text-amber-300 hover:bg-amber-500/20"
            title="Nova pasta"
          >
            <LucideFolderPlus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(data.pastas || []).map(p => {
            const ativa = p.id === pastaAtivaId;
            const editando = editandoPastaId === p.id;
            return (
              <div
                key={p.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-white/5 transition ${
                  ativa ? 'bg-amber-500/15 border-l-2 border-l-amber-400' : 'hover:bg-white/5'
                }`}
                onClick={() => !editando && setPastaAtivaId(p.id)}
              >
                <LucideFolder className={`w-4 h-4 flex-shrink-0 ${ativa ? 'text-amber-300' : 'text-slate-400'}`} />
                {editando ? (
                  <input
                    autoFocus
                    value={editandoPastaNome}
                    onChange={(e) => setEditandoPastaNome(e.target.value)}
                    onBlur={() => renomearPasta(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renomearPasta(p.id);
                      if (e.key === 'Escape') { setEditandoPastaId(null); setEditandoPastaNome(''); }
                    }}
                    className="flex-1 bg-slate-700 text-sm text-white px-1 py-0.5 rounded outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm text-white truncate">{p.nome}</span>
                )}
                <span className="text-[10px] text-slate-500">{p.items?.length || 0}</span>
                {!editando && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditandoPastaId(p.id);
                        setEditandoPastaNome(p.nome);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                      title="Renomear"
                    >
                      <LucideEdit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); excluirPasta(p.id); }}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                      title="Excluir pasta"
                    >
                      <LucideTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-white/10 text-[10px] text-slate-500 text-center">
          📦 Armazém de {user.nome}
        </div>
      </aside>

      {/* Conteúdo da pasta */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow flex-shrink-0">
            <LucidePackage className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              Armazém Próprio
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Pessoal
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              📁 {pastaAtiva?.nome} • {pastaAtiva?.items?.length || 0} item(ns)
            </div>
          </div>
          <div className="relative">
            <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar na pasta…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-slate-700/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
            />
          </div>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-900 to-slate-900/80">
          {itensFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <LucideStickyNote className="w-12 h-12 opacity-30" />
              <div className="text-sm">Nenhum item nesta pasta ainda.</div>
              <div className="text-xs">Use o campo abaixo para adicionar notas, links ou arquivos.</div>
            </div>
          ) : itensFiltrados.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              pastas={data.pastas}
              pastaAtivaId={pastaAtivaId}
              onRemover={() => removerItem(item.id)}
              onMover={(destId) => moverItem(item.id, destId)}
              editando={editandoItemId === item.id}
              editandoTexto={editandoItemTexto}
              onIniciarEdicao={() => {
                setEditandoItemId(item.id);
                setEditandoItemTexto(item.conteudo);
              }}
              onCancelarEdicao={() => { setEditandoItemId(null); setEditandoItemTexto(''); }}
              onMudarTextoEdicao={setEditandoItemTexto}
              onSalvarEdicao={salvarEdicaoItem}
            />
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-slate-800/80 border-t border-white/10 flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            title="Anexar arquivo"
          >
            <LucidePaperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={enviarArquivo}
          />
          <textarea
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarTexto();
              }
            }}
            placeholder="Escreva uma nota, cole um link…"
            rows={1}
            className="flex-1 bg-slate-700/60 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none max-h-32"
          />
          <button
            onClick={enviarTexto}
            disabled={!novoTexto.trim()}
            className={`p-2 rounded-lg transition flex-shrink-0 ${
              novoTexto.trim()
                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
            title="Salvar nota"
          >
            <LucidePlus className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}

function ItemCard({
  item, pastas, pastaAtivaId,
  onRemover, onMover,
  editando, editandoTexto, onIniciarEdicao, onCancelarEdicao,
  onMudarTextoEdicao, onSalvarEdicao,
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const outrasPastas = pastas.filter(p => p.id !== pastaAtivaId);

  const downloadArquivo = () => {
    const a = document.createElement('a');
    a.href = item.conteudo;
    a.download = item.fileName || 'arquivo';
    a.click();
  };

  return (
    <div className="group bg-slate-800/60 border border-white/10 rounded-2xl p-3 hover:border-amber-500/30 transition relative">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] text-slate-500">{formatTs(item.em)}{item.editadoEm ? ' (editado)' : ''}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {item.tipo === 'texto' || item.tipo === 'link' ? (
            <button
              onClick={onIniciarEdicao}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Editar"
            >
              <LucideEdit2 className="w-3.5 h-3.5" />
            </button>
          ) : null}
          {outrasPastas.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setMoveOpen(o => !o)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                title="Mover para…"
              >
                <LucideFolder className="w-3.5 h-3.5" />
              </button>
              {moveOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-slate-800 border border-white/10 rounded-lg shadow-xl min-w-[140px] py-1">
                  <div className="px-2 py-1 text-[10px] text-slate-400 uppercase">Mover para</div>
                  {outrasPastas.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onMover(p.id); setMoveOpen(false); }}
                      className="w-full text-left px-2 py-1.5 text-xs text-white hover:bg-white/10 flex items-center gap-2"
                    >
                      <LucideFolder className="w-3 h-3 text-amber-300" /> {p.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onRemover}
            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
            title="Remover"
          >
            <LucideTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editando ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={editandoTexto}
            onChange={(e) => onMudarTextoEdicao(e.target.value)}
            rows={3}
            className="w-full bg-slate-700/60 border border-amber-500/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelarEdicao}
              className="px-3 py-1 text-xs text-slate-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={onSalvarEdicao}
              className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-white rounded-lg"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : item.tipo === 'imagem' ? (
        <div>
          <img
            src={item.conteudo}
            alt={item.fileName || ''}
            className="max-h-64 rounded-lg cursor-pointer"
            onClick={downloadArquivo}
            title="Clique para baixar"
          />
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <LucideImage className="w-3 h-3" /> {item.fileName}
          </div>
        </div>
      ) : item.tipo === 'arquivo' ? (
        <button
          onClick={downloadArquivo}
          className="w-full flex items-center gap-3 bg-slate-700/40 hover:bg-slate-700/70 rounded-lg p-3 transition text-left"
        >
          <span className="text-2xl">{iconeArquivo(item.mime)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{item.fileName}</div>
            <div className="text-[10px] text-slate-400">
              {(item.fileSize / 1024).toFixed(1)} KB
            </div>
          </div>
          <LucideDownload className="w-4 h-4 text-amber-300" />
        </button>
      ) : item.tipo === 'link' ? (
        <a
          href={item.conteudo.startsWith('http') ? item.conteudo : `https://${item.conteudo}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-indigo-300 hover:text-indigo-200 underline break-all"
        >
          🔗 {item.conteudo}
        </a>
      ) : (
        <div className="text-sm text-white whitespace-pre-wrap break-words">{item.conteudo}</div>
      )}
    </div>
  );
}
