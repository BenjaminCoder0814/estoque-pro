// Chat.jsx — Chat interno SIZ estilo WhatsApp Web / Instagram Direct
// Realtime: Firebase Firestore + onSnapshot (equivalente a WebSocket)
// Features: apagar (eu/todos) · fixar · favoritar · marcar não-lida · responder ·
//           encaminhar · pesquisar · digitando · check duplo · anexos · emojis ·
//           notificações Web + som · admin vê tudo (incluindo apagadas)

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import {
  LucideMessageSquare, LucideSend, LucidePaperclip, LucideX,
  LucideDownload, LucideSearch, LucideEye, LucideAlertCircle,
  LucideUser, LucideShield, LucideChevronLeft, LucideChevronUp, LucideChevronDown,
  LucideMic, LucideCamera, LucideStopCircle, LucideSmile,
  LucideMoreVertical, LucideReply, LucideForward, LucideStar, LucidePin,
  LucideTrash2, LucideCheck, LucideCheckCheck, LucideCopy, LucideMailOpen,
  LucideInfo, LucideImage, LucideFile, LucidePinOff, LucideStarOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, query, where,
} from 'firebase/firestore';

import {
  CHAT_COL, CHAT_KEY, READ_KEY,
  TODOS_USUARIOS, BADGES_PERFIL, COMMON_EMOJIS,
  avatarGradient, loadConversas, saveConversas, loadRead, saveRead,
  convId, getOrCreateConv, msgVisivel, contarNaoLidas,
  renderTextWithLinks, formatTs, formatDataSep, iconeArquivo,
  previewMsg, nomeUsuario, agruparPorDia, tocarSomNotificacao,
  escapeRegex, formatarTempo, gerarMsgId, resumoMsg,
} from './chat/chatHelpers';

// ─────────────────────────────────────────────────────────────────────
// Persistência Firestore
// ─────────────────────────────────────────────────────────────────────
function syncConvFirestore(conv) {
  // limpa fields locais que não devem persistir
  const payload = {
    participantIds: conv.participantIds,
    messages: conv.messages || [],
    typing: conv.typing || {},
    markedUnreadBy: conv.markedUnreadBy || [],
    updatedAt: Date.now(),
  };
  setDoc(doc(db, CHAT_COL, conv.id), payload).catch(e =>
    console.error('Chat sync error:', e)
  );
}

function patchConvFirestore(convIdStr, patch) {
  updateDoc(doc(db, CHAT_COL, convIdStr), {
    ...patch,
    updatedAt: Date.now(),
  }).catch(e => console.error('Chat patch error:', e));
}

// ─────────────────────────────────────────────────────────────────────
// Texto com links + highlight de busca
// ─────────────────────────────────────────────────────────────────────
function RenderText({ text, highlight }) {
  const partes = renderTextWithLinks(text) || [];
  const re = highlight ? new RegExp(`(${escapeRegex(highlight)})`, 'gi') : null;

  return (
    <>
      {partes.map((p, i) => {
        if (p.tipo === 'link') {
          return (
            <a key={i} href={p.valor} target="_blank" rel="noreferrer"
               className="underline text-indigo-300 break-all hover:text-indigo-200">
              {p.valor}
            </a>
          );
        }
        if (!re) return <span key={i}>{p.valor}</span>;
        const subParts = p.valor.split(re);
        return (
          <span key={i}>
            {subParts.map((s, j) => re.test(s)
              ? <mark key={j} className="bg-yellow-300/40 text-yellow-100 rounded px-0.5">{s}</mark>
              : <span key={j}>{s}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Emoji Picker
// ─────────────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, onClose }) {
  return (
    <div className="absolute bottom-14 left-2 z-50 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-3 w-72 max-h-72 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-300 font-medium">Emojis</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <LucideX className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {COMMON_EMOJIS.map((e, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(e)}
            className="w-8 h-8 hover:bg-white/10 rounded-lg text-xl flex items-center justify-center transition"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Context Menu (clique direito ou long-press na mensagem)
// ─────────────────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
  // ajusta posição pra não sair da tela
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const w = window.innerWidth, h = window.innerHeight;
    let left = x, top = y;
    if (left + r.width  > w - 8) left = Math.max(8, w - r.width  - 8);
    if (top  + r.height > h - 8) top  = Math.max(8, h - r.height - 8);
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    const onDoc = () => onClose();
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[200] bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[200px]"
      style={{ left: pos.left, top: pos.top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) => it.divider ? (
        <div key={i} className="h-px bg-white/10 my-1" />
      ) : (
        <button
          key={i}
          onClick={() => { it.onClick(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition ${
            it.danger
              ? 'text-rose-300 hover:bg-rose-500/15'
              : 'text-slate-200 hover:bg-white/10'
          }`}
        >
          {it.icon && <it.icon className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Forward Modal
// ─────────────────────────────────────────────────────────────────────
function ForwardModal({ open, onClose, onSend, contatos, userId }) {
  const [selecionados, setSelecionados] = useState([]);
  const [busca, setBusca] = useState('');
  useEffect(() => { if (open) { setSelecionados([]); setBusca(''); } }, [open]);

  if (!open) return null;
  const filtrados = contatos.filter(c =>
    c.id !== userId &&
    (!busca || c.nome.toLowerCase().includes(busca.toLowerCase()))
  );

  const toggle = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <LucideForward className="w-5 h-5" /> Encaminhar para…
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <LucideX className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 pt-3">
          <div className="relative">
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar contato…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-slate-700/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filtrados.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">Nenhum contato</div>
          ) : filtrados.map(c => {
            const sel = selecionados.includes(c.id);
            const badge = BADGES_PERFIL[c.perfil];
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                  sel ? 'bg-indigo-500/30 ring-1 ring-indigo-400' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(c.id)} flex items-center justify-center text-white font-bold shadow flex-shrink-0`}>
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                    {c.nome}
                    {badge && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                  sel ? 'bg-indigo-500 border-indigo-400' : 'border-slate-500'
                }`}>
                  {sel && <LucideCheck className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">
            {selecionados.length === 0 ? 'Selecione 1 ou mais contatos' :
             `${selecionados.length} contato${selecionados.length > 1 ? 's' : ''}`}
          </span>
          <button
            disabled={selecionados.length === 0}
            onClick={() => { onSend(selecionados); onClose(); }}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <LucideSend className="w-4 h-4" /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mensagem (bolha) — render com reply, status, ações
// ─────────────────────────────────────────────────────────────────────
function MessageBubble({
  m, isMeu, isAdmin, userId, modoAdminTotal,
  highlightId, search, replyTargetId,
  onContextMenu, onJumpTo, onImageClick,
}) {
  const remetente = TODOS_USUARIOS.find(u => u.id === m.de);
  const apagada   = m.deletedForAll;
  const apagadaPraMim = Array.isArray(m.deletedFor) && m.deletedFor.includes(userId);

  // Para admin: vê tudo (mesmo "apagada pra todos") com estilo riscado
  const mostrarApagada = apagada && isAdmin;
  const mostrarComoApagada = apagada || apagadaPraMim;

  // Long-press mobile
  const pressTimer = useRef(null);
  const handleTouchStart = (e) => {
    pressTimer.current = setTimeout(() => {
      const t = e.touches[0];
      onContextMenu({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {} }, m);
    }, 500);
  };
  const handleTouchEnd = () => { clearTimeout(pressTimer.current); };

  // Status de leitura (somente minhas mensagens)
  const outroId = modoAdminTotal ? null
    : remetente ? null : null; // unused; calc fora
  const readByOther = (() => {
    if (!isMeu || !m.readBy) return false;
    return Object.keys(m.readBy).some(uid => Number(uid) !== userId);
  })();

  // Reply preview
  const reply = m.replyTo;

  return (
    <div
      id={`msg-${m.id}`}
      className={`flex items-end gap-2 mb-1 ${isMeu ? 'flex-row-reverse' : 'flex-row'} ${
        highlightId === m.id ? 'animate-pulse-fast' : ''
      }`}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, m); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {!isMeu && (
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(m.de)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1`}
          title={m.deNome}
        >
          {remetente?.nome?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}

      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 shadow group relative ${
          mostrarComoApagada
            ? 'bg-slate-700/40 text-slate-400 italic border border-dashed border-slate-600'
            : isMeu
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm'
              : 'bg-slate-700/80 text-slate-100 rounded-bl-sm'
        } ${m.pinned ? 'ring-2 ring-amber-400/60' : ''} ${
          replyTargetId === m.id ? 'ring-2 ring-cyan-400/60' : ''
        }`}
      >
        {/* Forwarded badge */}
        {m.forwardedFrom && !mostrarComoApagada && (
          <div className="flex items-center gap-1 text-[10px] text-slate-300 mb-1 italic opacity-80">
            <LucideForward className="w-3 h-3" /> Encaminhada
          </div>
        )}

        {/* Pinned badge */}
        {m.pinned && (
          <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full w-5 h-5 flex items-center justify-center shadow" title="Mensagem fixada">
            <LucidePin className="w-3 h-3" />
          </div>
        )}

        {/* Starred badge */}
        {Array.isArray(m.starredBy) && m.starredBy.includes(userId) && (
          <div className="absolute -bottom-1.5 -right-1.5 bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 flex items-center justify-center shadow" title="Favoritada">
            <LucideStar className="w-2.5 h-2.5 fill-current" />
          </div>
        )}

        {/* Nome do remetente (em conversas onde mostramos) */}
        {(modoAdminTotal || !isMeu) && !mostrarComoApagada && (
          <div className={`text-[10px] font-semibold mb-1 ${isMeu ? 'text-indigo-200' : 'text-indigo-300'}`}>
            {m.deNome}
          </div>
        )}

        {/* Reply quote */}
        {reply && !mostrarComoApagada && (
          <button
            type="button"
            onClick={() => onJumpTo?.(reply.id)}
            className="w-full text-left mb-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 border-l-2 border-cyan-400 hover:bg-black/30 transition"
          >
            <div className="text-[10px] font-semibold text-cyan-300">{reply.deNome}</div>
            <div className="text-[11px] text-slate-300 truncate">{reply.resumo}</div>
          </button>
        )}

        {/* Conteúdo */}
        {mostrarComoApagada ? (
          <div className="text-xs flex items-center gap-1.5">
            <LucideTrash2 className="w-3.5 h-3.5" />
            {apagada
              ? (mostrarApagada
                  ? <span>Mensagem apagada para todos — {m.deNome} <span className="opacity-60">(visível só p/ admin)</span></span>
                  : <span>Esta mensagem foi apagada</span>)
              : <span>Você apagou esta mensagem</span>}
          </div>
        ) : (
          <>
            {m.tipo === 'texto' && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                <RenderText text={m.conteudo} highlight={search} />
              </div>
            )}

            {m.tipo === 'imagem' && (
              <div>
                <img
                  src={m.arquivo?.b64}
                  alt={m.conteudo}
                  className="max-w-full max-h-60 rounded-xl cursor-zoom-in object-contain"
                  onClick={() => onImageClick?.(m.arquivo?.b64)}
                />
                {m.conteudo && m.conteudo !== m.arquivo?.nome && (
                  <div className="text-[11px] text-slate-300 mt-1">
                    <RenderText text={m.conteudo} highlight={search} />
                  </div>
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

            {m.tipo === 'audio' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs opacity-70">
                  <LucideMic className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Mensagem de voz</span>
                </div>
                <audio
                  src={m.arquivo?.b64}
                  controls
                  className="w-48"
                  style={{ height: '34px', colorScheme: 'dark' }}
                />
              </div>
            )}
          </>
        )}

        {/* Rodapé: hora + status de leitura + botão menu */}
        <div className={`flex items-center gap-1 mt-1 ${isMeu ? 'justify-end' : 'justify-end'}`}>
          {m.editedAt && !mostrarComoApagada && (
            <span className="text-[9px] opacity-60 italic mr-1">editada</span>
          )}
          <span className={`text-[10px] ${isMeu ? 'text-indigo-200' : 'text-slate-500'}`}>
            {formatTs(m.em)}
          </span>
          {isMeu && !mostrarComoApagada && (
            readByOther
              ? <LucideCheckCheck className="w-3.5 h-3.5 text-sky-300" title="Lida" />
              : <LucideCheck className="w-3.5 h-3.5 text-indigo-300" title="Enviada" />
          )}
          {!mostrarComoApagada && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onContextMenu(e, m); }}
              className={`opacity-0 group-hover:opacity-70 hover:opacity-100 transition p-0.5 rounded ${
                isMeu ? 'text-indigo-200' : 'text-slate-400'
              }`}
              title="Ações"
            >
              <LucideMoreVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pinned bar (mensagens fixadas) — só desktop
// ─────────────────────────────────────────────────────────────────────
function PinnedBar({ pinned, onJump, onUnpin, canUnpin }) {
  const [idx, setIdx] = useState(0);
  if (!pinned || pinned.length === 0) return null;
  const cur = pinned[Math.min(idx, pinned.length - 1)];
  const next = () => setIdx((idx + 1) % pinned.length);

  return (
    <div
      onClick={() => onJump(cur.id)}
      className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition"
    >
      <LucidePin className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-amber-300">
          Fixada • {cur.deNome} {pinned.length > 1 && <span className="opacity-70">({idx + 1}/{pinned.length})</span>}
        </div>
        <div className="text-xs text-slate-200 truncate">{resumoMsg(cur)}</div>
      </div>
      {pinned.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="p-1 text-amber-300 hover:text-amber-200"
          title="Próxima fixada"
        >
          <LucideChevronDown className="w-4 h-4" />
        </button>
      )}
      {canUnpin(cur) && (
        <button
          onClick={(e) => { e.stopPropagation(); onUnpin(cur.id); }}
          className="p-1 text-amber-300 hover:text-rose-300"
          title="Desafixar"
        >
          <LucidePinOff className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Info Panel (3a coluna desktop) — mostra mídia, fixadas e favoritas
// ─────────────────────────────────────────────────────────────────────
function InfoPanel({ conv, userId, onJump, onClose, modoAdminTotal }) {
  const [aba, setAba] = useState('midia'); // midia | fixadas | favoritas
  if (!conv) return null;

  const visiveis = (conv.messages || []).filter(m => msgVisivel(m, userId, false));
  const midias    = visiveis.filter(m => m.tipo === 'imagem' || m.tipo === 'arquivo' || m.tipo === 'audio');
  const fixadas   = visiveis.filter(m => m.pinned);
  const favoritas = visiveis.filter(m => Array.isArray(m.starredBy) && m.starredBy.includes(userId));

  const outroId = conv.participantIds.find(id => id !== userId) ?? conv.participantIds[0];
  const outro = TODOS_USUARIOS.find(u => u.id === outroId);
  const badge = outro ? BADGES_PERFIL[outro.perfil] : null;

  return (
    <aside className="hidden lg:flex flex-col w-80 bg-slate-800/60 border-l border-white/10 flex-shrink-0">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <LucideInfo className="w-4 h-4" /> Informações
        </span>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
          <LucideX className="w-4 h-4" />
        </button>
      </div>

      {/* Header contato */}
      <div className="px-4 py-5 border-b border-white/10 flex flex-col items-center text-center">
        {modoAdminTotal ? (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-2">
            <LucideShield className="w-8 h-8" />
          </div>
        ) : (
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarGradient(outroId)} flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-2`}>
            {outro?.nome?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div className="text-base font-semibold text-white">
          {modoAdminTotal
            ? conv.participantIds.map(id => nomeUsuario(id)).join(' ↔ ')
            : outro?.nome}
        </div>
        {!modoAdminTotal && badge && (
          <span className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        )}
        <div className="text-[11px] text-slate-400 mt-2">
          {conv.messages.length} mensagens trocadas
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 text-xs">
        {[
          { id: 'midia',     label: 'Mídia',     count: midias.length,   icon: LucideImage },
          { id: 'fixadas',   label: 'Fixadas',   count: fixadas.length,  icon: LucidePin   },
          { id: 'favoritas', label: 'Favoritas', count: favoritas.length,icon: LucideStar  },
        ].map(t => {
          const Ic = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border-b-2 transition ${
                aba === t.id
                  ? 'border-indigo-400 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Ic className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className="text-[9px] bg-white/10 rounded-full px-1.5 py-0.5">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {(aba === 'midia' ? midias : aba === 'fixadas' ? fixadas : favoritas).length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">Nada por aqui</div>
        ) : (aba === 'midia' ? midias : aba === 'fixadas' ? fixadas : favoritas).map(m => (
          <button
            key={m.id}
            onClick={() => onJump(m.id)}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition"
          >
            {m.tipo === 'imagem' && m.arquivo?.b64 ? (
              <img src={m.arquivo.b64} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                {m.tipo === 'audio' ? '🎤' : iconeArquivo(m.arquivo?.mime)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate">{resumoMsg(m)}</div>
              <div className="text-[10px] text-slate-400">{m.deNome} • {formatTs(m.em)}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

// ═════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════
export default function Chat() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN' || user?.perfil === 'TI';

  const [conversas, setConversas]   = useState(loadConversas);
  const [readMap, setReadMap]       = useState(loadRead);
  const [convAtiva, setConvAtiva]   = useState(null);
  const [modoAdminTotal, setModoAdminTotal] = useState(false);
  const [textInput, setTextInput]   = useState('');
  const [buscaContato, setBuscaContato] = useState('');
  const [buscaConv, setBuscaConv]   = useState('');
  const [showBuscaConv, setShowBuscaConv] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [mobileListVisible, setMobileListVisible] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  const [replyingTo, setReplyingTo] = useState(null);     // mensagem alvo de reply
  const [forwardMsg, setForwardMsg] = useState(null);     // mensagem a encaminhar
  const [ctxMenu, setCtxMenu]       = useState(null);     // { x, y, msg }
  const [showEmoji, setShowEmoji]   = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const fileInputRef      = useRef(null);
  const cameraInputRef    = useRef(null);
  const mensagensRef      = useRef(null);
  const textAreaRef       = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const recordingTimerRef = useRef(null);
  const lastMsgTsRef      = useRef({});
  const convAtivaRef      = useRef(null);
  const lastTypingSentRef = useRef(0);

  const [isRecording, setIsRecording]     = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => { convAtivaRef.current = convAtiva; }, [convAtiva]);

  // Pedir permissão de notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sync Firestore tempo real
  useEffect(() => {
    if (!user) return;
    const col = collection(db, CHAT_COL);
    const q = isAdmin ? col : query(col, where('participantIds', 'array-contains', user.id));
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Detectar novas mensagens p/ notificar
      convs.forEach(conv => {
        const lastMsg = conv.messages?.at(-1);
        if (!lastMsg) return;
        const lastKnown = lastMsgTsRef.current[conv.id];
        if (lastKnown !== undefined && lastMsg.em > lastKnown && lastMsg.de !== user.id && !lastMsg.deletedForAll) {
          const jaAberta = convAtivaRef.current === conv.id && document.visibilityState === 'visible';
          if (!jaAberta) {
            tocarSomNotificacao();
            if ('Notification' in window && Notification.permission === 'granted') {
              const remetente = nomeUsuario(lastMsg.de);
              const corpo =
                lastMsg.tipo === 'texto'  ? lastMsg.conteudo :
                lastMsg.tipo === 'audio'  ? '🎤 Mensagem de voz' :
                lastMsg.tipo === 'imagem' ? '🖼️ Imagem' : '📎 Arquivo';
              const notif = new Notification(`💬 ${remetente}`, {
                body: corpo,
                icon: `${import.meta.env.BASE_URL}favicon.ico`,
                tag: conv.id,
              });
              notif.onclick = () => {
                window.focus();
                setConvAtiva(conv.id);
                setMobileListVisible(false);
              };
            }
          }
        }
        lastMsgTsRef.current[conv.id] = lastMsg.em;
      });

      setConversas(prev => {
        const merged = [...convs];
        prev.forEach(lc => { if (!merged.find(fc => fc.id === lc.id)) merged.push(lc); });
        saveConversas(merged);
        return merged;
      });
    });
    return () => unsub();
  }, [user, isAdmin]);

  // Auto-scroll
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [convAtiva, conversas]);

  // Marcar como lido + atualizar readBy de mensagens recebidas
  useEffect(() => {
    if (!convAtiva || !user || modoAdminTotal) return;
    const conv = conversas.find(c => c.id === convAtiva);
    if (!conv) return;

    // localStorage timestamp
    const agora = Date.now();
    setReadMap(prev => {
      const next = {
        ...prev,
        [user.id]: { ...(prev[user.id] || {}), [convAtiva]: agora }
      };
      saveRead(next);
      return next;
    });

    // Limpar markedUnread
    if (Array.isArray(conv.markedUnreadBy) && conv.markedUnreadBy.includes(user.id)) {
      const novo = conv.markedUnreadBy.filter(id => id !== user.id);
      patchConvFirestore(conv.id, { markedUnreadBy: novo });
    }

    // Atualizar readBy nas msgs não lidas — apenas se aba está visível
    if (document.visibilityState === 'visible') {
      let mutou = false;
      const novasMsgs = (conv.messages || []).map(m => {
        if (m.de === user.id) return m;
        if (m.readBy && m.readBy[user.id]) return m;
        if (m.deletedForAll) return m;
        mutou = true;
        return { ...m, readBy: { ...(m.readBy || {}), [user.id]: agora } };
      });
      if (mutou) patchConvFirestore(conv.id, { messages: novasMsgs });
    }
  }, [convAtiva, conversas, user, modoAdminTotal]);

  const convAtivaObj = useMemo(
    () => conversas.find(c => c.id === convAtiva) || null,
    [conversas, convAtiva]
  );

  const meuContatos = useMemo(
    () => TODOS_USUARIOS.filter(u => u.id !== user?.id),
    [user]
  );

  const todasConversas = useMemo(() => {
    return conversas
      .filter(c => c.messages && c.messages.length > 0)
      .sort((a,b) => (b.messages.at(-1)?.em || 0) - (a.messages.at(-1)?.em || 0));
  }, [conversas]);

  const contatosFiltrados = useMemo(() => {
    const q = buscaContato.toLowerCase();
    return meuContatos
      .filter(c => !q || c.nome.toLowerCase().includes(q) || c.perfil.toLowerCase().includes(q))
      .map(contato => {
        const id = convId(user.id, contato.id);
        const conv = conversas.find(c => c.id === id);
        const ultima = conv?.messages.findLast?.(m => msgVisivel(m, user.id, false))
                   || (conv?.messages || []).filter(m => msgVisivel(m, user.id, false)).at(-1);
        const naoLidas = conv ? contarNaoLidas(conv, user.id, readMap) : 0;
        // typing
        const outroId = contato.id;
        const typingTs = conv?.typing?.[outroId];
        const typingActive = typingTs && (Date.now() - typingTs < 4000);
        return { ...contato, convId: id, ultima, naoLidas, typingActive };
      })
      .sort((a,b) => (b.ultima?.em || 0) - (a.ultima?.em || 0));
  }, [meuContatos, buscaContato, conversas, readMap, user]);

  // ── Abrir conversa
  const abrirConversa = useCallback((uidA, uidB) => {
    const atualConvs = loadConversas();
    const { convs: novasConvs, conv } = getOrCreateConv(atualConvs, uidA, uidB);
    if (novasConvs.length !== atualConvs.length) {
      saveConversas(novasConvs);
      setConversas(novasConvs);
      syncConvFirestore(conv);
    }
    setConvAtiva(conv.id);
    setMobileListVisible(false);
    setReplyingTo(null);
    setShowBuscaConv(false);
    setBuscaConv('');
  }, []);

  // ── Adicionar mensagem (genérico)
  const addMensagem = useCallback((msg, targetConvId = convAtiva) => {
    setConversas(prev => {
      const updated = prev.map(c =>
        c.id === targetConvId ? { ...c, messages: [...(c.messages || []), msg] } : c
      );
      saveConversas(updated);
      const updatedConv = updated.find(c => c.id === targetConvId);
      if (updatedConv) syncConvFirestore(updatedConv);
      return updated;
    });
  }, [convAtiva]);

  // ── Enviar texto
  const enviarTexto = useCallback(() => {
    const txt = textInput.trim();
    if (!txt || !convAtiva || !user || modoAdminTotal) return;
    const msg = {
      id: gerarMsgId(),
      de: user.id,
      deNome: user.nome,
      tipo: 'texto',
      conteudo: txt,
      em: Date.now(),
    };
    if (replyingTo) {
      msg.replyTo = {
        id: replyingTo.id,
        deNome: replyingTo.deNome,
        resumo: resumoMsg(replyingTo),
        tipo: replyingTo.tipo,
      };
    }
    addMensagem(msg);
    setTextInput('');
    setReplyingTo(null);
    setShowEmoji(false);
    textAreaRef.current?.focus();
    // Limpar typing
    if (convAtivaObj) {
      const novoTyping = { ...(convAtivaObj.typing || {}) };
      delete novoTyping[user.id];
      patchConvFirestore(convAtiva, { typing: novoTyping });
    }
  }, [textInput, convAtiva, user, modoAdminTotal, replyingTo, addMensagem, convAtivaObj]);

  // ── Enviar arquivo
  const enviarArquivo = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !convAtiva || !user) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      if (b64.length > 700_000) {
        alert('Arquivo muito grande (máx. ~500KB). Tente compactar ou usar um arquivo menor.');
        return;
      }
      const tipo = file.type.startsWith('image/') ? 'imagem'
                 : file.type.startsWith('audio/') ? 'audio'
                 : 'arquivo';
      const msg = {
        id: gerarMsgId(),
        de: user.id,
        deNome: user.nome,
        tipo,
        conteudo: file.name,
        arquivo: { nome: file.name, mime: file.type, b64 },
        em: Date.now(),
      };
      if (replyingTo) {
        msg.replyTo = {
          id: replyingTo.id, deNome: replyingTo.deNome,
          resumo: resumoMsg(replyingTo), tipo: replyingTo.tipo,
        };
      }
      addMensagem(msg);
      setReplyingTo(null);
    };
    reader.readAsDataURL(file);
  }, [convAtiva, user, replyingTo, addMensagem]);

  // ── Gravação de áudio
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      clearInterval(recordingTimerRef.current);
    };
  }, []);

  const iniciarGravacao = useCallback(async () => {
    if (!convAtiva || !user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onload = (ev) => {
          const b64 = ev.target.result;
          if (b64.length > 700_000) {
            alert('Áudio muito longo. Tente uma mensagem mais curta.');
            return;
          }
          const msg = {
            id: gerarMsgId(),
            de: user.id, deNome: user.nome,
            tipo: 'audio', conteudo: 'Mensagem de voz',
            arquivo: { nome: 'audio.webm', mime, b64 },
            em: Date.now(),
          };
          if (replyingTo) {
            msg.replyTo = {
              id: replyingTo.id, deNome: replyingTo.deNome,
              resumo: resumoMsg(replyingTo), tipo: replyingTo.tipo,
            };
          }
          addMensagem(msg);
          setReplyingTo(null);
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [convAtiva, user, replyingTo, addMensagem]);

  const pararGravacao = useCallback(() => {
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch {}
      mediaRecorderRef.current = null;
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  // ── Typing indicator throttled
  const sinalizarTyping = useCallback(() => {
    if (!convAtiva || !user || !convAtivaObj || modoAdminTotal) return;
    const agora = Date.now();
    if (agora - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = agora;
    const novoTyping = { ...(convAtivaObj.typing || {}), [user.id]: agora };
    patchConvFirestore(convAtiva, { typing: novoTyping });
  }, [convAtiva, user, convAtivaObj, modoAdminTotal]);

  // ── Tecla Enter
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarTexto();
    } else {
      sinalizarTyping();
    }
  }, [enviarTexto, sinalizarTyping]);

  // ── Ações nas mensagens (executam patch no Firestore)
  const editarMensagens = useCallback((mutator) => {
    if (!convAtiva) return;
    setConversas(prev => {
      const updated = prev.map(c => {
        if (c.id !== convAtiva) return c;
        return { ...c, messages: (c.messages || []).map(mutator) };
      });
      saveConversas(updated);
      const conv = updated.find(c => c.id === convAtiva);
      if (conv) patchConvFirestore(convAtiva, { messages: conv.messages });
      return updated;
    });
  }, [convAtiva]);

  const apagarParaMim = (m) => {
    editarMensagens(x => x.id === m.id
      ? { ...x, deletedFor: [...new Set([...(x.deletedFor || []), user.id])] }
      : x);
  };

  const apagarParaTodos = (m) => {
    if (!confirm('Apagar esta mensagem para todos?')) return;
    editarMensagens(x => x.id === m.id
      ? { ...x, deletedForAll: true, conteudo: '', arquivo: null }
      : x);
  };

  const togglePin = (m) => {
    editarMensagens(x => x.id === m.id
      ? { ...x, pinned: !x.pinned, pinnedAt: !x.pinned ? Date.now() : null }
      : x);
  };

  const toggleStar = (m) => {
    editarMensagens(x => {
      if (x.id !== m.id) return x;
      const starred = Array.isArray(x.starredBy) ? x.starredBy : [];
      return starred.includes(user.id)
        ? { ...x, starredBy: starred.filter(id => id !== user.id) }
        : { ...x, starredBy: [...starred, user.id] };
    });
  };

  const copiarMensagem = (m) => {
    const txt = m.tipo === 'texto' ? m.conteudo : resumoMsg(m);
    navigator.clipboard?.writeText(txt).catch(() => {});
  };

  const encaminharPara = (msg, contactIds) => {
    contactIds.forEach(cid => {
      const cId = convId(user.id, cid);
      // garante que a conversa existe
      const atual = loadConversas();
      const { convs: novas, conv } = getOrCreateConv(atual, user.id, cid);
      if (novas.length !== atual.length) {
        saveConversas(novas);
        setConversas(novas);
        syncConvFirestore(conv);
      }
      const novaMsg = {
        ...msg,
        id: gerarMsgId(),
        de: user.id,
        deNome: user.nome,
        em: Date.now(),
        forwardedFrom: { deNome: msg.deNome, originalId: msg.id },
        replyTo: null, deletedFor: [], deletedForAll: false,
        pinned: false, starredBy: [], readBy: {},
      };
      addMensagem(novaMsg, cId);
    });
  };

  // ── Marcar conversa como não lida (manual)
  const marcarConvNaoLida = useCallback(() => {
    if (!convAtiva || !user) return;
    const conv = conversas.find(c => c.id === convAtiva);
    if (!conv) return;
    const ja = conv.markedUnreadBy || [];
    if (!ja.includes(user.id)) {
      patchConvFirestore(conv.id, { markedUnreadBy: [...ja, user.id] });
    }
    // sinal de saída
    setConvAtiva(null);
    setMobileListVisible(true);
  }, [convAtiva, conversas, user]);

  // ── Jumping para uma mensagem
  const jumpToMsg = useCallback((msgId) => {
    setHighlightId(msgId);
    setTimeout(() => {
      const el = document.getElementById(`msg-${msgId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
    setTimeout(() => setHighlightId(null), 2000);
  }, []);

  // ── Context menu options for a message
  const buildCtxMenuItems = (m) => {
    if (!m) return [];
    const items = [];
    const naoApagada = !m.deletedForAll;

    if (!modoAdminTotal && naoApagada) {
      items.push({ icon: LucideReply,   label: 'Responder',  onClick: () => setReplyingTo(m) });
    }
    if (m.tipo === 'texto' && naoApagada) {
      items.push({ icon: LucideCopy,    label: 'Copiar',     onClick: () => copiarMensagem(m) });
    }
    if (!modoAdminTotal && naoApagada) {
      const starred = Array.isArray(m.starredBy) && m.starredBy.includes(user.id);
      items.push({
        icon: starred ? LucideStarOff : LucideStar,
        label: starred ? 'Desfavoritar' : 'Favoritar',
        onClick: () => toggleStar(m),
      });
      items.push({
        icon: m.pinned ? LucidePinOff : LucidePin,
        label: m.pinned ? 'Desafixar' : 'Fixar mensagem',
        onClick: () => togglePin(m),
      });
      items.push({
        icon: LucideForward, label: 'Encaminhar',
        onClick: () => setForwardMsg(m),
      });
      items.push({ divider: true });
      items.push({
        icon: LucideTrash2, label: 'Apagar para mim',
        onClick: () => apagarParaMim(m), danger: true,
      });
      // apagar para todos: somente autor (ou admin)
      if (m.de === user.id || isAdmin) {
        items.push({
          icon: LucideTrash2, label: 'Apagar para todos',
          onClick: () => apagarParaTodos(m), danger: true,
        });
      }
    }
    return items;
  };

  // ── Pinned messages (filtradas a visíveis)
  const pinnedMsgs = useMemo(() => {
    if (!convAtivaObj) return [];
    return (convAtivaObj.messages || []).filter(m =>
      m.pinned && msgVisivel(m, user?.id, isAdmin)
    );
  }, [convAtivaObj, user, isAdmin]);

  // ── Mensagens da conversa ativa filtradas/buscadas
  const mensagensVisiveis = useMemo(() => {
    if (!convAtivaObj) return [];
    return (convAtivaObj.messages || []).filter(m =>
      msgVisivel(m, user?.id, isAdmin && modoAdminTotal)
    );
  }, [convAtivaObj, user, isAdmin, modoAdminTotal]);

  // ── Typing do outro participante
  const outroDigitando = useMemo(() => {
    if (!convAtivaObj || !user || modoAdminTotal) return null;
    const outroId = convAtivaObj.participantIds.find(id => id !== user.id);
    const ts = convAtivaObj.typing?.[outroId];
    if (!ts) return null;
    if (Date.now() - ts > 4000) return null;
    return nomeUsuario(outroId);
  }, [convAtivaObj, user, modoAdminTotal]);

  const totalNaoLidos = useMemo(() => {
    if (!user) return 0;
    return conversas.reduce((acc, c) => acc + contarNaoLidas(c, user.id, readMap), 0);
  }, [conversas, readMap, user]);

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-1 min-h-0 bg-slate-900 overflow-hidden relative">

      {/* ═══ SIDEBAR esquerda ═══ */}
      <aside
        className={`flex flex-col bg-slate-800/80 border-r border-white/10 w-80 flex-shrink-0
          md:flex md:relative
          ${mobileListVisible ? 'flex absolute inset-0 z-20 w-full' : 'hidden md:flex'}`}
      >
        {/* Header sidebar */}
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
              {modoAdminTotal ? 'Modo: Ver todas as conversas' : 'Ver todas (Admin)'}
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {modoAdminTotal ? (
            todasConversas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
                <LucideMessageSquare className="w-8 h-8 opacity-40" />
                <span>Nenhuma conversa</span>
              </div>
            ) : todasConversas.map(conv => {
              const ultima = (conv.messages || []).at(-1);
              const isAtiva = conv.id === convAtiva;
              return (
                <button
                  key={conv.id}
                  onClick={() => { setConvAtiva(conv.id); setMobileListVisible(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-white/5 ${
                    isAtiva ? 'bg-indigo-500/20 border-l-2 border-l-indigo-400' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow flex-shrink-0">
                    <LucideShield className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {conv.participantIds.map(id => nomeUsuario(id)).join(' ↔ ')}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{previewMsg(ultima, user?.id)}</div>
                  </div>
                  {ultima && (
                    <div className="text-[10px] text-slate-500 flex-shrink-0">{formatTs(ultima.em)}</div>
                  )}
                </button>
              );
            })
          ) : (
            contatosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
                <LucideSearch className="w-8 h-8 opacity-40" />
                <span>Nenhum contato encontrado</span>
              </div>
            ) : contatosFiltrados.map(contato => {
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium text-white truncate">{contato.nome}</span>
                      {badge && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs truncate ${
                      contato.typingActive
                        ? 'text-emerald-300 italic'
                        : contato.naoLidas > 0
                          ? 'text-white font-medium'
                          : 'text-slate-400'
                    }`}>
                      {contato.typingActive ? 'digitando…' : previewMsg(contato.ultima, user.id)}
                    </div>
                  </div>
                  {contato.ultima && (
                    <div className="text-[10px] text-slate-500 flex-shrink-0">{formatTs(contato.ultima.em)}</div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ═══ MAIN — Conversa ═══ */}
      <main className={`flex-1 flex flex-col min-w-0 relative ${mobileListVisible ? 'hidden md:flex' : 'flex'}`}>
        {convAtiva && convAtivaObj ? (
          <>
            {/* Header conversa */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-white/10 flex-shrink-0">
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
                        {modoAdminTotal
                          ? convAtivaObj.participantIds.map(id => nomeUsuario(id)).join(' ↔ ')
                          : outro?.nome}
                        {badge && !modoAdminTotal && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {outroDigitando
                          ? <span className="text-emerald-300 italic">digitando…</span>
                          : `${mensagensVisiveis.length} mensagens`}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Botões header */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowBuscaConv(s => !s)}
                  className={`p-2 rounded-lg transition ${showBuscaConv ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                  title="Buscar na conversa"
                >
                  <LucideSearch className="w-4 h-4" />
                </button>
                {!modoAdminTotal && (
                  <button
                    onClick={marcarConvNaoLida}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title="Marcar como não lida"
                  >
                    <LucideMailOpen className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowInfoPanel(s => !s)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition hidden lg:flex"
                  title="Informações"
                >
                  <LucideInfo className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Barra de busca dentro da conversa */}
            {showBuscaConv && (
              <div className="px-4 py-2 bg-slate-800/60 border-b border-white/10 flex items-center gap-2">
                <LucideSearch className="w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Pesquisar nesta conversa…"
                  value={buscaConv}
                  onChange={e => setBuscaConv(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                />
                {buscaConv && (
                  <button onClick={() => setBuscaConv('')} className="text-slate-400 hover:text-white">
                    <LucideX className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Pinned bar */}
            <PinnedBar
              pinned={pinnedMsgs}
              onJump={jumpToMsg}
              onUnpin={(id) => editarMensagens(x => x.id === id ? { ...x, pinned: false } : x)}
              canUnpin={() => !modoAdminTotal}
            />

            {/* Área de mensagens */}
            <div
              ref={mensagensRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
              style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' }}
            >
              {mensagensVisiveis.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <LucideMessageSquare className="w-14 h-14 opacity-30" />
                  <span className="text-sm">Nenhuma mensagem ainda. Diga olá! 👋</span>
                </div>
              ) : (() => {
                const filtradas = buscaConv
                  ? mensagensVisiveis.filter(m => {
                      const txt = (m.conteudo || '') + ' ' + (m.arquivo?.nome || '');
                      return txt.toLowerCase().includes(buscaConv.toLowerCase());
                    })
                  : mensagensVisiveis;

                if (buscaConv && filtradas.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                      <LucideSearch className="w-12 h-12 opacity-30" />
                      <span className="text-sm">Nada encontrado para "{buscaConv}"</span>
                    </div>
                  );
                }

                return agruparPorDia(filtradas).map(item => {
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
                  return (
                    <MessageBubble
                      key={item.key}
                      m={m}
                      isMeu={isMeu}
                      isAdmin={isAdmin}
                      userId={user?.id}
                      modoAdminTotal={modoAdminTotal}
                      highlightId={highlightId}
                      search={buscaConv}
                      replyTargetId={replyingTo?.id}
                      onContextMenu={(e, msg) => setCtxMenu({ x: e.clientX, y: e.clientY, msg })}
                      onJumpTo={jumpToMsg}
                      onImageClick={setLightboxImg}
                    />
                  );
                });
              })()}
            </div>

            {/* Input */}
            {modoAdminTotal ? (
              <div className="px-4 py-3 bg-slate-800/60 border-t border-white/10 flex items-center gap-2">
                <LucideEye className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-400 italic">Modo visualização — Admin não envia mensagens aqui</span>
              </div>
            ) : (
              <div className="bg-slate-800/60 border-t border-white/10 flex-shrink-0">
                {/* Reply preview */}
                {replyingTo && (
                  <div className="px-4 pt-2 pb-1.5 border-b border-white/5 flex items-center gap-2 bg-slate-900/40">
                    <div className="w-1 h-9 bg-cyan-400 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                        <LucideReply className="w-3 h-3" /> Respondendo {replyingTo.deNome}
                      </div>
                      <div className="text-xs text-slate-300 truncate">{resumoMsg(replyingTo)}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1 text-slate-400 hover:text-rose-300"
                    >
                      <LucideX className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="px-4 py-3 relative">
                  {showEmoji && (
                    <EmojiPicker
                      onPick={(e) => {
                        setTextInput(t => t + e);
                        textAreaRef.current?.focus();
                      }}
                      onClose={() => setShowEmoji(false)}
                    />
                  )}

                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => setShowEmoji(s => !s)}
                      title="Emojis"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition mb-0.5 flex-shrink-0"
                    >
                      <LucideSmile className="w-5 h-5" />
                    </button>

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
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.csv,audio/*,video/*"
                    />

                    <textarea
                      ref={textAreaRef}
                      value={textInput}
                      onChange={e => { setTextInput(e.target.value); sinalizarTyping(); }}
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

                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      title="Tirar foto com a câmera"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition mb-0.5 flex-shrink-0"
                    >
                      <LucideCamera className="w-5 h-5" />
                    </button>
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={enviarArquivo}
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                    />

                    {isRecording ? (
                      <>
                        <span className="text-red-400 text-xs font-mono flex-shrink-0 self-center animate-pulse">
                          🔴 {formatarTempo(recordingTime)}
                        </span>
                        <button
                          onClick={pararGravacao}
                          title="Parar e enviar áudio"
                          className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition mb-0.5 flex-shrink-0"
                        >
                          <LucideStopCircle className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={iniciarGravacao}
                        title="Gravar mensagem de áudio"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition mb-0.5 flex-shrink-0"
                      >
                        <LucideMic className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={enviarTexto}
                      disabled={!textInput.trim()}
                      title="Enviar mensagem"
                      className={`p-2.5 rounded-xl transition mb-0 flex-shrink-0 ${
                        textInput.trim()
                          ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow'
                          : 'bg-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <LucideSend className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Estado vazio
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 px-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <LucideMessageSquare className="w-12 h-12 opacity-40" />
            </div>
            <div>
              <div className="text-lg font-medium text-slate-300">Bem-vindo ao Chat SIZ</div>
              <div className="text-sm text-slate-500 mt-1">
                Selecione um contato à esquerda para começar a conversar
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══ Info Panel (3ª coluna desktop) ═══ */}
      {convAtivaObj && showInfoPanel && (
        <InfoPanel
          conv={convAtivaObj}
          userId={user?.id}
          onJump={jumpToMsg}
          onClose={() => setShowInfoPanel(false)}
          modoAdminTotal={modoAdminTotal}
        />
      )}

      {/* ═══ Lightbox de imagem ═══ */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[180] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <LucideX className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ═══ Context Menu ═══ */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={buildCtxMenuItems(ctxMenu.msg)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ═══ Forward Modal ═══ */}
      <ForwardModal
        open={!!forwardMsg}
        onClose={() => setForwardMsg(null)}
        contatos={TODOS_USUARIOS}
        userId={user?.id}
        onSend={(ids) => {
          if (forwardMsg) encaminharPara(forwardMsg, ids);
          setForwardMsg(null);
        }}
      />
    </div>
  );
}
