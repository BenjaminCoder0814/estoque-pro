// chatHelpers.js — utilitários puros do chat SIZ
// Mantém compatibilidade com o modelo antigo: mensagens sem campos novos são tratadas como defaults.

export const CHAT_COL = 'chat_conversas';
export const CHAT_KEY = 'zkChat';
export const READ_KEY = 'zkChatRead';

// IMPORTANTE: este array é apenas um FALLBACK visual usado quando a API
// /api/users/contacts ainda não respondeu (ex.: backend dormindo no Render).
// Assim que o backend responder, este array é substituído pela lista real
// (com os IDs verdadeiros do banco) — ver AuthContext.refreshContatosFromApi.
export const TODOS_USUARIOS = [
  { id: 1,   nome: 'Administrador',          perfil: 'ADMIN' },
  { id: 2,   nome: 'Expedição',              perfil: 'EXPEDICAO' },
  { id: 3,   nome: 'Compras',                perfil: 'COMPRAS' },
  { id: 4,   nome: 'Central de Atendimento', perfil: 'CENTRAL_ATENDIMENTO' },
  { id: 6,   nome: 'Produção',               perfil: 'PRODUCAO' },
  { id: 7,   nome: 'TI',                     perfil: 'TI' },
  { id: 8,   nome: 'Diretoria',              perfil: 'DIRETORIA' },
  // Vendas (perfil COMERCIAL) — espelha o seed do backend
  { id: 101, nome: 'Vendas 1',               perfil: 'COMERCIAL' },
  { id: 103, nome: 'Vendas 3',               perfil: 'COMERCIAL' },
  { id: 104, nome: 'Vendas 4',               perfil: 'COMERCIAL' },
  { id: 105, nome: 'Vendas 5',               perfil: 'COMERCIAL' },
  { id: 110, nome: 'Vendas 10',              perfil: 'COMERCIAL' },
  { id: 112, nome: 'Vendas 12',              perfil: 'COMERCIAL' },
];

export const BADGES_PERFIL = {
  ADMIN:               { bg: 'bg-purple-500/20',  text: 'text-purple-300',  label: 'Admin'      },
  DIRETORIA:           { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', label: 'Diretoria'  },
  TI:                  { bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    label: 'TI'         },
  EXPEDICAO:           { bg: 'bg-blue-500/20',    text: 'text-blue-300',    label: 'Expedição'  },
  COMPRAS:             { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Compras'    },
  SUPERVISAO:          { bg: 'bg-amber-500/20',   text: 'text-amber-300',   label: 'Supervisão' },
  CENTRAL_ATENDIMENTO: { bg: 'bg-amber-500/20',   text: 'text-amber-300',   label: 'Central'    },
  COMERCIAL:           { bg: 'bg-rose-500/20',    text: 'text-rose-300',    label: 'Vendas'     },
  PRODUCAO:            { bg: 'bg-orange-500/20',  text: 'text-orange-300',  label: 'Produção'   },
};

// ─────────────────────────────────────────────────────────────────────
// Overrides fixos de identidade no CHAT (não alteram o login real)
// Aplicado em qualquer usuário com perfil correspondente: nome, cargo e avatar
// passam a ser exibidos como definido aqui para TODOS os outros logins.
// ─────────────────────────────────────────────────────────────────────
// As imagens ficam em frontend/public/imagens/ (servidas em /estoque/imagens/).
// Usamos BASE_URL para funcionar tanto local quanto em produção.
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/estoque/';
const IMG_BASE = `${BASE}imagens`;

export const PERFIL_OVERRIDES = {
  ADMIN: {
    nome: 'Anna Paula',
    perfil: 'DIRETORIA',
    avatarUrl: `${IMG_BASE}/mascote2.png`,
  },
  DIRETORIA: {
    nome: 'Richard Maciel',
    perfil: 'DIRETORIA',
    avatarUrl: `${IMG_BASE}/mascote1.png`,
  },
  TI: {
    nome: '',
    perfil: 'TI',
    avatarUrl: `${IMG_BASE}/ti-benjamin.png`,
  },
};

// Aplica o override no usuário, se houver. Override SEMPRE vence (nome fixo, foto fixa).
export function aplicarOverridePerfil(u) {
  if (!u || !u.perfil) return u;
  const ov = PERFIL_OVERRIDES[u.perfil];
  if (!ov) return u;
  return {
    ...u,
    nome: ov.nome,
    perfil: ov.perfil,
    avatarUrl: ov.avatarUrl,
  };
}

// Versão "display only": mantém o perfil real (para não quebrar permissões)
// e apenas troca nome e foto. Usada na Sidebar/Topbar.
export function aplicarOverrideDisplay(u) {
  if (!u || !u.perfil) return u;
  const ov = PERFIL_OVERRIDES[u.perfil];
  if (!ov) return u;
  return {
    ...u,
    nome: ov.nome,
    avatarUrl: ov.avatarUrl,
  };
}

const AVATAR_CORES = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

export function avatarGradient(userId) {
  return AVATAR_CORES[((userId || 0) - 1 + AVATAR_CORES.length) % AVATAR_CORES.length];
}

export const COMMON_EMOJIS = [
  '😀','😁','😂','🤣','😅','😊','😍','😘','😎','🤩',
  '🤔','😏','😴','🤤','🥲','😭','😢','😡','🤬','😱',
  '👍','👎','👏','🙌','🙏','💪','🤝','✌️','🤞','🫡',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️',
  '🔥','✨','🎉','🎊','💯','✅','❌','⚠️','📌','⭐',
  '📎','📷','📁','📄','📊','📦','🚀','💼','🛒','💰',
];

export function loadConversas() {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); }
  catch { return []; }
}
export function saveConversas(convs) {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(convs)); } catch {}
}
export function loadRead() {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); }
  catch { return {}; }
}
export function saveRead(r) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(r)); } catch {}
}

export function convId(a, b) {
  return `c_${Math.min(a,b)}_${Math.max(a,b)}`;
}

export function getOrCreateConv(convs, uidA, uidB) {
  const id = convId(uidA, uidB);
  const ex = convs.find(c => c.id === id);
  if (ex) return { convs, conv: ex };
  const nova = {
    id,
    participantIds: [Math.min(uidA,uidB), Math.max(uidA,uidB)],
    messages: [],
    typing: {},
    markedUnreadBy: [],
  };
  return { convs: [...convs, nova], conv: nova };
}

// Mensagem está visível pro usuário? (não deletada para todos OU admin vê tudo; não deletada só pra ele)
export function msgVisivel(m, userId, isAdmin) {
  if (m.deletedForAll && !isAdmin) return false;
  if (Array.isArray(m.deletedFor) && m.deletedFor.includes(userId)) return false;
  return true;
}

// Conta não-lidas (ignora mensagens apagadas para o próprio usuário)
export function contarNaoLidas(conv, userId, readMap) {
  if (!conv?.messages) return 0;
  if (Array.isArray(conv.markedUnreadBy) && conv.markedUnreadBy.includes(userId)) {
    // Conversa marcada como não-lida manualmente: garante badge >= 1
    const base = conv.messages.filter(m => m.de !== userId && msgVisivel(m, userId, false)).length;
    return Math.max(1, base);
  }
  const visto = readMap?.[userId]?.[conv.id] || 0;
  return conv.messages.filter(m =>
    m.de !== userId && m.em > visto && msgVisivel(m, userId, false)
  ).length;
}

export function renderTextWithLinks(text) {
  if (!text) return null;
  const urlRe = /(https?:\/\/[^\s<>"]+)/g;
  const parts = text.split(urlRe);
  return parts.map((p, i) =>
    urlRe.test(p)
      ? { tipo: 'link', valor: p, key: i }
      : { tipo: 'texto', valor: p, key: i }
  );
}

export function formatTs(ts) {
  if (!ts) return '';
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

export function formatDataSep(ts) {
  const d = new Date(ts);
  const hoje = new Date();
  const ontem = new Date(); ontem.setDate(ontem.getDate()-1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
}

export function iconeArquivo(mime) {
  if (!mime) return '📎';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime.includes('zip') || mime.includes('rar')) return '📦';
  if (mime.startsWith('audio/')) return '🎤';
  if (mime.startsWith('video/')) return '🎬';
  return '📎';
}

export function previewMsg(m, userId) {
  if (!m) return 'Nenhuma mensagem ainda';
  if (m.deletedForAll) return '🚫 Mensagem apagada';
  if (Array.isArray(m.deletedFor) && userId && m.deletedFor.includes(userId)) return '🚫 Você apagou esta mensagem';
  if (m.tipo === 'imagem')  return '🖼️ Imagem';
  if (m.tipo === 'arquivo') return `📎 ${m.conteudo}`;
  if (m.tipo === 'audio')   return '🎤 Mensagem de voz';
  const txt = m.conteudo || '';
  return txt.length > 40 ? txt.slice(0,40) + '…' : txt;
}

export function nomeUsuario(uid, contatos) {
  if (Array.isArray(contatos) && contatos.length) {
    const hit = contatos.find(u => u.id === uid);
    if (hit) return hit.nome || 'Usuário';
  }
  const base = TODOS_USUARIOS.find(u => u.id === uid);
  if (!base) return 'Usuário';
  return aplicarOverridePerfil(base).nome || 'Usuário';
}

export function agruparPorDia(msgs) {
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

// Som de notificação (Web Audio API)
export function tocarSomNotificacao() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    [0, 0.18].forEach(delay => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
      osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + delay + 0.18);
      osc.connect(gain);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch { /* silencia */ }
}

export function escapeRegex(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatarTempo(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function gerarMsgId() {
  return Date.now() + '_' + Math.random().toString(36).slice(2);
}

// Resumo curto de uma mensagem para preview em reply/forward
export function resumoMsg(m) {
  if (!m) return '';
  if (m.deletedForAll) return 'Mensagem apagada';
  if (m.tipo === 'imagem')  return '🖼️ Imagem';
  if (m.tipo === 'arquivo') return `📎 ${m.conteudo || 'Arquivo'}`;
  if (m.tipo === 'audio')   return '🎤 Mensagem de voz';
  const txt = m.conteudo || '';
  return txt.length > 60 ? txt.slice(0,60) + '…' : txt;
}
