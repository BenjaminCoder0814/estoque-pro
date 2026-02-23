// Chat.jsx — Chat interno tipo WhatsApp entre usuários do sistema
// Cada usuário vê apenas suas próprias conversas.
// Admin pode ver TODAS as conversas de todos os usuários.
// Suporta: texto, imagens, documentos, links automáticos.
// Armazenamento: localStorage (compartilhado entre logins no mesmo browser).

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import {
  LucideMessageSquare, LucideSend, LucidePaperclip, LucideX,
  LucideDownload, LucideSearch, LucideEye, LucideAlertCircle,
  LucideChevronDown, LucideUser, LucideShield, LucideChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── Constantes de storage ──────────────────────────────────────────────
const CHAT_KEY  = 'zkChat';       // Array de conversas
const READ_KEY  = 'zkChatRead';   // { userId: { convId: timestamp } }

// ── Lista de usuários (espelho do AuthContext) ─────────────────────────
const TODOS_USUARIOS = [
  { id: 1, nome: 'Administrador', perfil: 'ADMIN' },
  { id: 2, nome: 'Expedição',     perfil: 'EXPEDICAO' },
  { id: 3, nome: 'Compras',       perfil: 'COMPRAS' },
  { id: 4, nome: 'Supervisão',    perfil: 'SUPERVISAO' },
  { id: 5, nome: 'Comercial',     perfil: 'COMERCIAL' },
];

const BADGES_PERFIL = {
  ADMIN:       { bg: 'bg-purple-500/20',    text: 'text-purple-300',  label: 'Admin'     },
  EXPEDICAO:   { bg: 'bg-blue-500/20',      text: 'text-blue-300',    label: 'Expedição' },
  COMPRAS:     { bg: 'bg-emerald-500/20',   text: 'text-emerald-300', label: 'Compras'   },
  SUPERVISAO:  { bg: 'bg-amber-500/20',     text: 'text-amber-300',   label: 'Supervisão'},
  COMERCIAL:   { bg: 'bg-rose-500/20',      text: 'text-rose-300',    label: 'Comercial' },
};

// ── Cores de avatar por userId ─────────────────────────────────────────
const AVATAR_CORES = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

function avatarGradient(userId) {
  return AVATAR_CORES[(userId - 1) % AVATAR_CORES.length];
}

// ── Helpers de storage ─────────────────────────────────────────────────
function loadConversas() {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); }
  catch { return []; }
}
function saveConversas(convs) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(convs));
}

function loadRead() {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); }
  catch { return {}; }
}
function saveRead(r) {
  localStorage.setItem(READ_KEY, JSON.stringify(r));
}

// ── ID canônico de conversa (sempre os IDs em ordem crescente) ─────────
function convId(a, b) {
  return `c_${Math.min(a,b)}_${Math.max(a,b)}`;
}

// ── Obter ou criar conversa ─────────────────────────────────────────────
function getOrCreateConv(convs, uidA, uidB) {
  const id = convId(uidA, uidB);
  const ex = convs.find(c => c.id === id);
  if (ex) return { convs, conv: ex };
  const nova = { id, participantIds: [Math.min(uidA,uidB), Math.max(uidA,uidB)], messages: [] };
  const updated = [...convs, nova];
  return { convs: updated, conv: nova };
}

// ── Contar mensagens não lidas ─────────────────────────────────────────
function contarNaoLidas(conv, userId, readMap) {
  const visto = readMap?.[userId]?.[conv.id] || 0;
  return conv.messages.filter(m => m.de !== userId && m.em > visto).length;
}

// ── Detectar e linkar URLs ─────────────────────────────────────────────
function renderTextWithLinks(text) {
  const urlRe = /(https?:\/\/[^\s<>"]+)/g;
  const parts = text.split(urlRe);
  return parts.map((p, i) =>
    urlRe.test(p)
      ? <a key={i} href={p} target="_blank" rel="noreferrer" className="underline text-indigo-300 break-all hover:text-indigo-200">{p}</a>
      : <span key={i}>{p}</span>
  );
}

// ── Formatar timestamp ─────────────────────────────────────────────────
function formatTs(ts) {
  const d = new Date(ts);
  const hoje = new Date();
  const ontem = new Date(); ontem.setDate(ontem.getDate()-1);
  if (d.toDateString() === hoje.toDateString()) {
    return d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  }
  if (d.toDateString() === ontem.toDateString()) {
    return 'Ontem ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  }
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' ' +
         d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

// ── Formatar data de separador ─────────────────────────────────────────
function formatDataSep(ts) {
  const d = new Date(ts);
  const hoje = new Date();
  const ontem = new Date(); ontem.setDate(ontem.getDate()-1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
}

// ── Ícone de tipo de arquivo ───────────────────────────────────────────
function iconeArquivo(mime) {
  if (mime?.startsWith('image/')) return '🖼️';
  if (mime?.includes('pdf')) return '📄';
  if (mime?.includes('word') || mime?.includes('document')) return '📝';
  if (mime?.includes('sheet') || mime?.includes('excel')) return '📊';
  if (mime?.includes('zip') || mime?.includes('rar')) return '📦';
  return '📎';
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';

  // Estado principal
  const [conversas, setConversas]         = useState(loadConversas);
  const [readMap,   setReadMap]           = useState(loadRead);
  const [convAtiva, setConvAtiva]         = useState(null);   // id string da conversa
  const [modoAdminTotal, setModoAdminTotal] = useState(false); // admin vê todas
  const [textInput, setTextInput]         = useState('');
  const [buscaContato, setBuscaContato]   = useState('');
  const [lightboxImg, setLightboxImg]     = useState(null);   // URL base64 da imagem ampliada
  const [mobileListVisible, setMobileListVisible] = useState(true);

  const fileInputRef  = useRef(null);
  const mensagensRef  = useRef(null);
  const textAreaRef   = useRef(null);

  // ── Sincronizar alterações de outro "tab" / login ────────────────────
  useEffect(() => {
    function onStorage(e) {
      if (e.key === CHAT_KEY) setConversas(loadConversas());
      if (e.key === READ_KEY) setReadMap(loadRead());
    }
    window.addEventListener('storage', onStorage);
    // Poll a cada 3s para o caso de estar na mesma tab (mesmo origin)
    const timer = setInterval(() => {
      setConversas(loadConversas());
    }, 3000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
    };
  }, []);

  // ── Rolar para o fim quando muda conversa ou chegam mensagens ────────
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [convAtiva, conversas]);

  // ── Marcar como lido quando abre a conversa ───────────────────────────
  useEffect(() => {
    if (!convAtiva || !user) return;
    const agora = Date.now();
    setReadMap(prev => {
      const next = {
        ...prev,
        [user.id]: { ...(prev[user.id] || {}), [convAtiva]: agora }
      };
      saveRead(next);
      return next;
    });
  }, [convAtiva, conversas, user]);

  // ── Conversa ativa (objeto) ───────────────────────────────────────────
  const convAtivaObj = useMemo(
    () => conversas.find(c => c.id === convAtiva) || null,
    [conversas, convAtiva]
  );

  // ── Para usuário normal: lista os outros usuários para conversar ──────
  const meuContatos = useMemo(() => {
    return TODOS_USUARIOS.filter(u => u.id !== user?.id);
  }, [user]);

  // ── Para admin no modo total: todas conversas existentes ─────────────
  const todasConversas = useMemo(() => {
    return conversas
      .filter(c => c.messages.length > 0)
      .sort((a,b) => {
        const la = a.messages.at(-1)?.em || 0;
        const lb = b.messages.at(-1)?.em || 0;
        return lb - la;
      });
  }, [conversas]);

  // ── Lista de contatos do usuário normal (com dados enriquecidos) ──────
  const contatosFiltrados = useMemo(() => {
    const q = buscaContato.toLowerCase();
    return meuContatos
      .filter(c => !q || c.nome.toLowerCase().includes(q) || c.perfil.toLowerCase().includes(q))
      .map(contato => {
        const id = convId(user.id, contato.id);
        const conv = conversas.find(c => c.id === id);
        const ultima = conv?.messages.at(-1) || null;
        const naoLidas = conv ? contarNaoLidas(conv, user.id, readMap) : 0;
        return { ...contato, convId: id, ultima, naoLidas };
      })
      .sort((a,b) => {
        const ta = a.ultima?.em || 0;
        const tb = b.ultima?.em || 0;
        return tb - ta;
      });
  }, [meuContatos, buscaContato, conversas, readMap, user]);

  // ── Abrir conversa (com ou sem criar) ─────────────────────────────────
  const abrirConversa = useCallback((uidA, uidB) => {
    const atualConvs = loadConversas();
    const { convs: novasConvs, conv } = getOrCreateConv(atualConvs, uidA, uidB);
    if (novasConvs.length !== atualConvs.length) {
      saveConversas(novasConvs);
      setConversas(novasConvs);
    }
    setConvAtiva(conv.id);
    setMobileListVisible(false);
  }, []);

  // ── Enviar mensagem de texto ───────────────────────────────────────────
  const enviarTexto = useCallback(() => {
    const txt = textInput.trim();
    if (!txt || !convAtiva || !user) return;
    const msg = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2),
      de: user.id,
      deNome: user.nome,
      tipo: 'texto',
      conteudo: txt,
      em: Date.now(),
    };
    setConversas(prev => {
      const updated = prev.map(c =>
        c.id === convAtiva ? { ...c, messages: [...c.messages, msg] } : c
      );
      saveConversas(updated);
      return updated;
    });
    setTextInput('');
    textAreaRef.current?.focus();
  }, [textInput, convAtiva, user]);

  // ── Enviar arquivo (imagem ou documento) ─────────────────────────────
  const enviarArquivo = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !convAtiva || !user) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result; // data:...; base64,...
      const tipo = file.type.startsWith('image/') ? 'imagem' : 'arquivo';
      const msg = {
        id: Date.now() + '_' + Math.random().toString(36).slice(2),
        de: user.id,
        deNome: user.nome,
        tipo,
        conteudo: file.name,
        arquivo: { nome: file.name, mime: file.type, b64 },
        em: Date.now(),
      };
      setConversas(prev => {
        const updated = prev.map(c =>
          c.id === convAtiva ? { ...c, messages: [...c.messages, msg] } : c
        );
        saveConversas(updated);
        return updated;
      });
    };
    reader.readAsDataURL(file);
  }, [convAtiva, user]);

  // ── Tecla Enter (sem Shift) envia ─────────────────────────────────────
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarTexto();
    }
  }, [enviarTexto]);

  // ── Nome do outro participante na conversa ─────────────────────────────
  function nomeOutro(conv) {
    if (!conv) return '';
    const outroId = conv.participantIds.find(id => id !== user?.id);
    const u = TODOS_USUARIOS.find(u => u.id === outroId);
    return u?.nome || 'Usuário';
  }

  // ── Agrupar mensagens por dia ──────────────────────────────────────────
  function agruparPorDia(msgs) {
    const grupos = [];
    let diaAtual = null;
    msgs.forEach(m => {
      const dia = new Date(m.em).toDateString();
      if (dia !== diaAtual) {
        grupos.push({ tipo: 'separador', ts: m.em, key: 'sep_' + m.em });
        diaAtual = dia;
      }
      grupos.push({ tipo: 'msg', msg: m, key: m.id });
    });
    return grupos;
  }

  // ── Última mensagem preview ────────────────────────────────────────────
  function previewMsg(m) {
    if (!m) return 'Nenhuma mensagem ainda';
    if (m.tipo === 'imagem')  return '🖼️ Imagem';
    if (m.tipo === 'arquivo') return `📎 ${m.conteudo}`;
    const txt = m.conteudo || '';
    return txt.length > 40 ? txt.slice(0,40) + '…' : txt;
  }

  // ── Informações das conversas no modo adminTotal ─────────────────────
  function nomesConv(conv) {
    return conv.participantIds.map(id =>
      TODOS_USUARIOS.find(u => u.id === id)?.nome || 'Usuário'
    ).join(' ↔ ');
  }

  // ── Total de não lidos (para sidebar badge externo) ───────────────────
  const totalNaoLidos = useMemo(() => {
    if (!user) return 0;
    return conversas.reduce((acc, c) => acc + contarNaoLidas(c, user.id, readMap), 0);
  }, [conversas, readMap, user]);

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-slate-900 overflow-hidden">

      {/* ═══════════════ PAINEL ESQUERDO — Lista de contatos ════════════ */}
      <aside
        className={`
          flex flex-col bg-slate-800/80 border-r border-white/10
          w-80 flex-shrink-0
          md:flex md:relative
          ${mobileListVisible ? 'flex absolute inset-0 z-20 w-full' : 'hidden md:flex'}
        `}
      >
        {/* Cabeçalho */}
        <div className="px-4 py-4 bg-slate-900/60 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(user?.id)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow`}>
              {user?.nome?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.nome}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.perfil}</div>
            </div>
            {totalNaoLidos > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {totalNaoLidos}
              </span>
            )}
          </div>

          {/* Busca */}
          {!modoAdminTotal && (
            <div className="relative">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar contato…"
                value={buscaContato}
                onChange={e => setBuscaContato(e.target.value)}
                className="w-full bg-slate-700/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Botão Admin: ver todas as conversas */}
          {isAdmin && (
            <button
              onClick={() => { setModoAdminTotal(m => !m); setConvAtiva(null); }}
              className={`mt-2 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                modoAdminTotal
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LucideEye className="w-3.5 h-3.5" />
              {modoAdminTotal ? 'Modo: Ver todas as conversas' : 'Ver todas as conversas (Admin)'}
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {modoAdminTotal ? (
            // ── Modo admin total: todas as conversas ──
            todasConversas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
                <LucideMessageSquare className="w-8 h-8 opacity-40" />
                <span>Nenhuma conversa ainda</span>
              </div>
            ) : (
              todasConversas.map(conv => {
                const ultima = conv.messages.at(-1);
                const isAtiva = conv.id === convAtiva;
                return (
                  <button
                    key={conv.id}
                    onClick={() => { setConvAtiva(conv.id); setMobileListVisible(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-white/5 ${
                      isAtiva ? 'bg-indigo-500/20 border-l-2 border-l-indigo-400' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow`}>
                        <LucideShield className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{nomesConv(conv)}</div>
                      <div className="text-xs text-slate-400 truncate">{previewMsg(ultima)}</div>
                    </div>
                    {ultima && (
                      <div className="text-[10px] text-slate-500 flex-shrink-0">{formatTs(ultima.em)}</div>
                    )}
                  </button>
                );
              })
            )
          ) : (
            // ── Modo normal: lista de contatos ──
            contatosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
                <LucideSearch className="w-8 h-8 opacity-40" />
                <span>Nenhum contato encontrado</span>
              </div>
            ) : (
              contatosFiltrados.map(contato => {
                const isAtiva = contato.convId === convAtiva;
                const badge = BADGES_PERFIL[contato.perfil];
                return (
                  <button
                    key={contato.id}
                    onClick={() => abrirConversa(user.id, contato.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-white/5 ${
                      isAtiva ? 'bg-indigo-500/20 border-l-2 border-l-indigo-400' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient(contato.id)} flex items-center justify-center text-white font-bold text-base shadow`}>
                        {contato.nome.charAt(0).toUpperCase()}
                      </div>
                      {contato.naoLidas > 0 && (
                        <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                          {contato.naoLidas}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-medium text-white truncate">{contato.nome}</span>
                        {badge && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs truncate ${contato.naoLidas > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                        {previewMsg(contato.ultima)}
                      </div>
                    </div>
                    {/* Hora */}
                    {contato.ultima && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-slate-500">{formatTs(contato.ultima.em)}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )
          )}
        </div>
      </aside>

      {/* ═══════════════ PAINEL DIREITO — Conversa ══════════════════════ */}
      <main className={`flex-1 flex flex-col min-w-0 ${mobileListVisible ? 'hidden md:flex' : 'flex'}`}>

        {convAtiva && convAtivaObj ? (
          <>
            {/* Header da conversa */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10 flex-shrink-0">
              {/* Botão voltar mobile */}
              <button
                className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                onClick={() => setMobileListVisible(true)}
              >
                <LucideChevronLeft className="w-5 h-5" />
              </button>

              {(() => {
                const outroId = modoAdminTotal
                  ? convAtivaObj.participantIds[0]
                  : convAtivaObj.participantIds.find(id => id !== user?.id);
                const outro = TODOS_USUARIOS.find(u => u.id === outroId);
                const badge = outro ? BADGES_PERFIL[outro.perfil] : null;
                return (
                  <>
                    {modoAdminTotal ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow flex-shrink-0">
                        <LucideShield className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(outroId)} flex items-center justify-center text-white font-bold shadow flex-shrink-0`}>
                        {outro?.nome?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {modoAdminTotal ? nomesConv(convAtivaObj) : outro?.nome}
                        {badge && !modoAdminTotal && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {modoAdminTotal
                          ? `${convAtivaObj.messages.length} mensagens`
                          : `${convAtivaObj.messages.length} mensagens trocadas`}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Área de mensagens */}
            <div
              ref={mensagensRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
              style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' }}
            >
              {convAtivaObj.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <LucideMessageSquare className="w-14 h-14 opacity-30" />
                  <span className="text-sm">Nenhuma mensagem ainda. Diga olá! 👋</span>
                </div>
              ) : (
                agruparPorDia(convAtivaObj.messages).map(item => {
                  if (item.tipo === 'separador') {
                    return (
                      <div key={item.key} className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[11px] text-slate-500 px-2 bg-slate-900/50 rounded-full py-0.5">
                          {formatDataSep(item.ts)}
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                    );
                  }

                  const m = item.msg;
                  const isMeu = !modoAdminTotal && m.de === user?.id;
                  const remetente = TODOS_USUARIOS.find(u => u.id === m.de);

                  return (
                    <div
                      key={item.key}
                      className={`flex items-end gap-2 mb-1 ${isMeu ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar miniatura */}
                      {!isMeu && (
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(m.de)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1`}
                          title={m.deNome}
                        >
                          {remetente?.nome?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}

                      {/* Balão */}
                      <div
                        className={`max-w-[70%] rounded-2xl px-3 py-2 shadow ${
                          isMeu
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm'
                            : 'bg-slate-700/80 text-slate-100 rounded-bl-sm'
                        }`}
                      >
                        {/* Nome remetente (admin ou conversa entre outros) */}
                        {(modoAdminTotal || !isMeu) && (
                          <div className={`text-[10px] font-semibold mb-1 ${isMeu ? 'text-indigo-200' : 'text-indigo-300'}`}>
                            {m.deNome}
                          </div>
                        )}

                        {/* Conteúdo por tipo */}
                        {m.tipo === 'texto' && (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {renderTextWithLinks(m.conteudo)}
                          </div>
                        )}

                        {m.tipo === 'imagem' && (
                          <div>
                            <img
                              src={m.arquivo?.b64}
                              alt={m.conteudo}
                              className="max-w-full max-h-60 rounded-xl cursor-zoom-in object-contain"
                              onClick={() => setLightboxImg(m.arquivo?.b64)}
                            />
                            {m.conteudo && (
                              <div className="text-[11px] text-slate-300 mt-1 truncate">{m.conteudo}</div>
                            )}
                          </div>
                        )}

                        {m.tipo === 'arquivo' && (
                          <a
                            href={m.arquivo?.b64}
                            download={m.arquivo?.nome}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                              isMeu ? 'bg-indigo-800/50 hover:bg-indigo-800' : 'bg-slate-600/50 hover:bg-slate-600'
                            }`}
                          >
                            <span className="text-xl">{iconeArquivo(m.arquivo?.mime)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{m.arquivo?.nome}</div>
                              <div className="text-[10px] text-slate-400">Clique para baixar</div>
                            </div>
                            <LucideDownload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          </a>
                        )}

                        {/* Timestamp */}
                        <div className={`text-[10px] mt-1 text-right ${isMeu ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {formatTs(m.em)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input (desabilitado para admin no modo total — só visualização) */}
            {modoAdminTotal ? (
              <div className="px-4 py-3 bg-slate-800/60 border-t border-white/10 flex items-center gap-2">
                <LucideEye className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-400 italic">Modo visualização — Admin não pode enviar mensagens aqui</span>
              </div>
            ) : (
              <div className="px-4 py-3 bg-slate-800/60 border-t border-white/10 flex-shrink-0">
                <div className="flex items-end gap-2">
                  {/* Anexar arquivo */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Anexar arquivo ou imagem"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition mb-0.5 flex-shrink-0"
                  >
                    <LucidePaperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={enviarArquivo}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv"
                  />

                  {/* Textarea */}
                  <textarea
                    ref={textAreaRef}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    placeholder="Digite uma mensagem… (Enter para enviar, Shift+Enter nova linha)"
                    style={{ resize: 'none', maxHeight: '120px' }}
                    className="flex-1 bg-slate-700/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-y-auto"
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />

                  {/* Botão enviar */}
                  <button
                    onClick={enviarTexto}
                    disabled={!textInput.trim()}
                    title="Enviar mensagem"
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition flex-shrink-0 mb-0.5 shadow"
                  >
                    <LucideSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // ── Estado vazio: nenhuma conversa selecionada ──
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center shadow-xl">
              <LucideMessageSquare className="w-9 h-9 text-indigo-500/60" />
            </div>
            <div className="text-center">
              <div className="text-base font-semibold text-slate-400 mb-1">Chat Interno Zenith</div>
              <div className="text-sm text-slate-600">
                {modoAdminTotal
                  ? 'Selecione uma conversa para visualizar'
                  : 'Selecione um contato para começar a conversar'
                }
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-700 bg-slate-800/40 rounded-lg px-4 py-2">
              <LucideAlertCircle className="w-3.5 h-3.5 text-indigo-600" />
              Apenas você e o destinatário veem a conversa
            </div>
            {/* Mobile: botão para abrir lista */}
            <button
              className="md:hidden mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition"
              onClick={() => setMobileListVisible(true)}
            >
              Ver contatos
            </button>
          </div>
        )}
      </main>

      {/* ═══════════════ LIGHTBOX de imagem ═════════════════════════════ */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition z-10"
            >
              <LucideX className="w-4 h-4" />
            </button>
            <img
              src={lightboxImg}
              alt="Imagem ampliada"
              className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
            <a
              href={lightboxImg}
              download="imagem"
              className="mt-3 flex items-center gap-2 justify-center text-sm text-slate-300 hover:text-white transition"
              onClick={e => e.stopPropagation()}
            >
              <LucideDownload className="w-4 h-4" />
              Baixar imagem
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
