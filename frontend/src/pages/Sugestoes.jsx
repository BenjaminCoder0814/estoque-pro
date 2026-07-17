// Sugestoes.jsx — Painel-chatbot de sugestões.
// • Mascote TI (ti-bot.png) conduz como recepcionista.
// • Todos os logins veem todas as sugestões (evita pedidos repetidos).
// • Bot só faz recepção e agradecimento — não tenta responder o pedido.
// • TI/ADMIN podem marcar como "feito" ou excluir.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LucideSend, LucideCheckCircle2, LucideClock, LucideTrash2,
  LucideSearch, LucideSparkles, LucideThumbsUp,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  gerarMsgId, formatTs, aplicarOverrideDisplay,
} from './chat/chatHelpers';

const SUG_DOC = 'config/sugestoes';
const CACHE_KEY = 'zkSugestoes';
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/estoque/';
const BOT_AVATAR = `${BASE}imagens/ti-bot.png`;

// Mensagens automáticas do "bot" (recepção / agradecimento — não responde o pedido)
const BOT_BOAS_VINDAS =
  'Olá! 👋 Sou o assistente do TI. Pode mandar aqui qualquer sugestão de melhoria para o sistema, processo ou produto. Tudo que você enviar chega direto pra equipe de TI analisar.';
const BOT_AGRADECIMENTOS = [
  'Recebido! 🙌 Obrigado pela sugestão — vou encaminhar para o TI dar uma olhada.',
  'Anotado! ✅ A equipe do TI já consegue ver aqui e vai avaliar.',
  'Sugestão registrada com sucesso! 💡 Obrigado por contribuir para melhorar o sistema.',
  'Beleza! 👌 Sua ideia foi salva e fica visível pra todo mundo. O TI cuida a partir daqui.',
  'Top! 🚀 Recebida sua sugestão. Obrigado pelo feedback!',
];

function escolherAgradecimento() {
  return BOT_AGRADECIMENTOS[Math.floor(Math.random() * BOT_AGRADECIMENTOS.length)];
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function Sugestoes() {
  const { user: userReal } = useAuth();
  const user = useMemo(() => aplicarOverrideDisplay(userReal), [userReal]);
  const isTI = userReal?.perfil === 'TI' || userReal?.perfil === 'ADMIN';

  const [data, setData] = useState(() =>
    loadCache() || { sugestoes: [], updatedAt: 0 }
  );
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas'); // todas | pendentes | feitas
  const [enviando, setEnviando] = useState(false);
  const skipNextRef = useRef(false);
  const lastSyncedAtRef = useRef(0);
  const listaRef = useRef(null);

  // Firestore subscription compartilhado
  useEffect(() => {
    const unsub = onSnapshot(doc(db, ...SUG_DOC.split('/')), (snap) => {
      if (!snap.exists()) return;
      const remote = snap.data();
      if (skipNextRef.current && remote.updatedAt === lastSyncedAtRef.current) {
        skipNextRef.current = false;
        return;
      }
      if (Array.isArray(remote.sugestoes)) {
        setData(remote);
        saveCache(remote);
      }
    }, (err) => console.warn('Sugestoes onSnapshot:', err?.message));
    return () => unsub();
  }, []);

  const persistir = useCallback((novoArr) => {
    const payload = {
      sugestoes: novoArr,
      updatedAt: Date.now(),
    };
    setData(payload);
    saveCache(payload);
    skipNextRef.current = true;
    lastSyncedAtRef.current = payload.updatedAt;
    setDoc(doc(db, ...SUG_DOC.split('/')), payload)
      .catch(e => console.warn('Sugestoes setDoc:', e?.message));
  }, []);

  const enviar = () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    const nova = {
      id: 's_' + gerarMsgId(),
      texto: t,
      autorId: user?.id || 0,
      autorNome: user?.nome || 'Anônimo',
      autorAvatar: user?.avatarUrl || '',
      criadoEm: Date.now(),
      status: 'pendente', // pendente | feita
      respondida: false,
    };
    persistir([...(data.sugestoes || []), nova]);
    setTexto('');
    setTimeout(() => setEnviando(false), 600);
    // rola pro fim
    setTimeout(() => {
      if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }, 50);
  };

  const marcarFeita = (id) => {
    if (!isTI) return;
    persistir((data.sugestoes || []).map(s =>
      s.id === id ? { ...s, status: s.status === 'feita' ? 'pendente' : 'feita', resolvidoPor: user?.nome, resolvidoEm: Date.now() } : s
    ));
  };

  const excluir = (id) => {
    if (!isTI) return;
    const s = (data.sugestoes || []).find(x => x.id === id);
    if (!s) return;
    if (!confirm(`Excluir esta sugestão?\n\n"${s.texto.slice(0, 80)}"`)) return;
    persistir((data.sugestoes || []).filter(x => x.id !== id));
  };

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let arr = data.sugestoes || [];
    if (filtro === 'pendentes') arr = arr.filter(s => s.status !== 'feita');
    if (filtro === 'feitas') arr = arr.filter(s => s.status === 'feita');
    if (q) arr = arr.filter(s =>
      (s.texto || '').toLowerCase().includes(q) ||
      (s.autorNome || '').toLowerCase().includes(q)
    );
    return [...arr].sort((a, b) => a.criadoEm - b.criadoEm);
  }, [data, busca, filtro]);

  // Scroll automático para o fim quando nova msg chega
  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [lista.length]);

  const stats = useMemo(() => {
    const arr = data.sugestoes || [];
    return {
      total: arr.length,
      pendentes: arr.filter(s => s.status !== 'feita').length,
      feitas: arr.filter(s => s.status === 'feita').length,
    };
  }, [data]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative">
            <img
              src={BOT_AVATAR}
              alt="Bot TI"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/60 shadow-lg bg-slate-800"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">Assistente do TI</h1>
              <LucideSparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <p className="text-[11px] text-slate-400">
              Mande aqui suas sugestões — todo mundo vê para evitar repetidos. O TI resolve.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-slate-300">
              <b className="text-white">{stats.total}</b> no total
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-xs text-amber-200">
              <b>{stats.pendentes}</b> pendentes
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-xs text-emerald-200">
              <b>{stats.feitas}</b> feitas
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="border-b border-white/10 bg-slate-900/70 px-4 sm:px-6 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
          {[
            { k: 'todas', label: 'Todas' },
            { k: 'pendentes', label: 'Pendentes' },
            { k: 'feitas', label: 'Feitas' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFiltro(f.k)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filtro === f.k
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
            <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sugestão…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div
        ref={listaRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4"
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Boas-vindas (sempre primeiro) */}
          <BotMsg avatar={BOT_AVATAR} texto={BOT_BOAS_VINDAS} />

          {lista.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-6">
              Nenhuma sugestão ainda. Seja o primeiro a registrar uma ideia!
            </div>
          ) : lista.map((s) => {
            const meu = s.autorId && userReal?.id === s.autorId;
            return (
              <React.Fragment key={s.id}>
                <UserMsg
                  meu={meu}
                  sug={s}
                  isTI={isTI}
                  onToggleFeita={() => marcarFeita(s.id)}
                  onExcluir={() => excluir(s.id)}
                />
                {/* Bot agradece logo abaixo de cada sugestão */}
                <BotMsg
                  avatar={BOT_AVATAR}
                  texto={escolherAgradecimentoEstavel(s.id)}
                  small
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-slate-900/80 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2 bg-slate-800/80 border border-white/10 rounded-2xl p-2">
            <textarea
              rows={1}
              placeholder="Digite sua sugestão e pressione Enter para enviar…"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 px-2 py-2 resize-none focus:outline-none max-h-32"
              style={{ minHeight: 36 }}
            />
            <button
              onClick={enviar}
              disabled={!texto.trim() || enviando}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                texto.trim() && !enviando
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <LucideSend className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 text-center">
            Enter envia · Shift+Enter quebra linha
          </div>
        </div>
      </div>
    </div>
  );
}

// Cache de agradecimento por sugestão (mantém a mesma frase pra cada msg)
const _agradecimentosCache = new Map();
function escolherAgradecimentoEstavel(id) {
  if (!_agradecimentosCache.has(id)) {
    _agradecimentosCache.set(id, escolherAgradecimento());
  }
  return _agradecimentosCache.get(id);
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────────────

function BotMsg({ avatar, texto, small }) {
  return (
    <div className="flex items-end gap-2">
      <img
        src={avatar}
        alt="TI"
        className={`${small ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover ring-2 ring-indigo-500/40 bg-slate-800 flex-shrink-0`}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className={`max-w-[80%] bg-slate-800/80 border border-white/10 rounded-2xl rounded-bl-md px-3 py-2 ${
        small ? 'text-xs text-slate-300' : 'text-sm text-white'
      }`}>
        {texto}
      </div>
    </div>
  );
}

function UserMsg({ meu, sug, isTI, onToggleFeita, onExcluir }) {
  const feita = sug.status === 'feita';
  return (
    <div className={`flex items-end gap-2 ${meu ? 'flex-row-reverse' : ''}`}>
      {sug.autorAvatar ? (
        <img
          src={sug.autorAvatar}
          alt={sug.autorNome}
          className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 bg-slate-700 flex-shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {(sug.autorNome || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className={`max-w-[80%] ${meu ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-3 py-2 rounded-2xl border ${
          feita
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-50'
            : meu
              ? 'bg-indigo-500/20 border-indigo-500/40 text-white rounded-br-md'
              : 'bg-slate-700/60 border-white/10 text-white rounded-bl-md'
        }`}>
          <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider opacity-80">
            <span className="font-semibold">{sug.autorNome}</span>
            <span>•</span>
            <span>{formatTs(sug.criadoEm)}</span>
            {feita && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <LucideCheckCircle2 className="w-3 h-3" /> resolvido
                </span>
              </>
            )}
          </div>
          <div className="text-sm whitespace-pre-wrap break-words">{sug.texto}</div>
          {feita && sug.resolvidoPor && (
            <div className="mt-1 text-[10px] text-emerald-200/80">
              Feito por {sug.resolvidoPor}{sug.resolvidoEm ? ` · ${formatTs(sug.resolvidoEm)}` : ''}
            </div>
          )}
        </div>
        {/* Ações TI */}
        {isTI && (
          <div className={`flex items-center gap-1 mt-1 ${meu ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={onToggleFeita}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition ${
                feita
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200'
              }`}
              title={feita ? 'Reabrir' : 'Marcar como feita'}
            >
              {feita ? (<><LucideClock className="w-3 h-3" /> Reabrir</>) : (<><LucideCheckCircle2 className="w-3 h-3" /> Feita</>)}
            </button>
            <button
              onClick={onExcluir}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 transition"
              title="Excluir"
            >
              <LucideTrash2 className="w-3 h-3" /> Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
