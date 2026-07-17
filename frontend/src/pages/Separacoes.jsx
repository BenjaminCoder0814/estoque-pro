// Separacoes.jsx — Sistema de Reservas & Separação de Estoque
// COMERCIAL + ADMIN : criar solicitações
// EXPEDICAO + ADMIN : avançar status (separando → separado → expedido)
// ADMIN             : cancelar, editar qualquer campo, ver tudo
// SUPERVISAO        : somente visualização completa + histórico
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  LucideTruck, LucidePlus, LucideX, LucideSearch, LucideFilter,
  LucideChevronDown, LucideChevronUp, LucideClock, LucideUser,
  LucideHistory, LucideEdit3, LucideCheckCircle,
  LucidePackage, LucideCalendar, LucideArrowRight, LucideEye,
  LucideTrash2, LucideClipboardCheck, LucideRefreshCw,
  LucideSortAsc, LucideSortDesc, LucideInfo, LucideAlertTriangle,
  LucideChevronRight, LucideBox,
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────────────────────────
const SEP_DOC = 'config/separacoes';
const SEP_CACHE_KEY = 'zkSeparacoes';

function loadSepsCache() {
  try {
    return JSON.parse(localStorage.getItem(SEP_CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}
function saveSepsCache(data) {
  try { localStorage.setItem(SEP_CACHE_KEY, JSON.stringify(data)); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  aguardando: { label: 'Aguardando',  bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-400',   btn: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'  },
  separando:  { label: 'Separando',   bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500',    btn: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'      },
  separado:   { label: 'Separado',    bg: 'bg-green-100',   text: 'text-green-800',   border: 'border-green-300',   dot: 'bg-green-500',   btn: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'  },
  expedido:   { label: 'Expedido',    bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-600', btn: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
  cancelado:  { label: 'Cancelado',   bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     dot: 'bg-red-400',     btn: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'          },
};

const PROXIMO = { aguardando: 'separando', separando: 'separado', separado: 'expedido' };
const LABEL_AVANCO = {
  aguardando: { label: 'Iniciar Separação', icon: '📦' },
  separando:  { label: 'Marcar Separado',   icon: '✅' },
  separado:   { label: 'Confirmar Expedição', icon: '🚚' },
};
const STATUS_LIST = ['aguardando', 'separando', 'separado', 'expedido', 'cancelado'];
const FORMAS_SAIDA = ['CIF', 'FOB', 'Coleta', 'Correio'];

const FORMA_COR = {
  CIF:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  FOB:     'bg-purple-100 text-purple-700 border-purple-200',
  Coleta:  'bg-teal-100 text-teal-700 border-teal-200',
  Correio: 'bg-orange-100 text-orange-700 border-orange-200',
};

const VAZIO_FORM = { produto: '', quantidade: '', cor: '', formaSaida: 'CIF', cliente: '', observacao: '' };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtDT(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}
function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR'); }
  catch { return '—'; }
}
function diaPar(iso)   { return new Date(iso).getDate() % 2 === 0; }
function diaImpar(iso) { return new Date(iso).getDate() % 2 !== 0; }

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.aguardando;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function FormaBadge({ forma }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${FORMA_COR[forma] || 'bg-gray-100 text-gray-600'}`}>
      {forma}
    </span>
  );
}

function Timeline({ historico }) {
  if (!historico?.length) return <p className="text-xs text-gray-400 py-4 text-center">Sem histórico registrado.</p>;
  return (
    <div className="relative pl-6 space-y-4">
      {/* linha vertical */}
      <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />
      {historico.map((h, i) => {
        const isFirst = i === historico.length - 1;
        return (
          <div key={i} className="relative">
            <span className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm
              ${h.acao === 'Criado' ? 'bg-indigo-400' :
                h.acao === 'Cancelado' ? 'bg-red-400' :
                h.acao === 'Expedido' ? 'bg-emerald-500' :
                h.statusPara === 'separado' ? 'bg-green-500' :
                h.statusPara === 'separando' ? 'bg-blue-500' : 'bg-gray-400'}`}
            />
            <div className={`bg-white rounded-xl border shadow-sm p-3 text-xs ${isFirst ? 'border-indigo-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                <span className="font-bold text-gray-800">{h.acao}</span>
                <span className="text-gray-400 text-[10px]">{fmtDT(h.em)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-gray-500">
                  <LucideUser className="w-3 h-3" /> {h.por}
                </span>
                {h.statusDe && h.statusPara && (
                  <span className="flex items-center gap-1">
                    <StatusBadge status={h.statusDe} />
                    <LucideArrowRight className="w-3 h-3 text-gray-400" />
                    <StatusBadge status={h.statusPara} />
                  </span>
                )}
              </div>
              {h.campos && h.campos.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {h.campos.map((c, j) => (
                    <li key={j} className="text-gray-500">
                      <span className="font-semibold text-gray-700">{c.campo}:</span>{' '}
                      <span className="line-through text-red-400">{c.de || '—'}</span>
                      {' → '}
                      <span className="text-green-600 font-medium">{c.para || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
              {h.obs && <p className="mt-1 text-gray-400 italic">"{h.obs}"</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Separacoes() {
  const { user, can } = useAuth();
  const podeCriar   = can.criarSeparacao;
  const podeAvancar = can.avancarSeparacao;
  const podeEditar  = can.editarSeparacao;
  const podeVer     = can.verSeparacoes;
  // verSeparacoesAll: central atendimento + admin/ti/diretoria veem todas; outros só as próprias
  const verTodas    = can.verSeparacoesAll;

  // ── dados ──────────────────────────────────────────────────────────────────
  const [sepData, setSepData] = useState(() =>
    loadSepsCache() || { separacoes: [], counter: 0, updatedAt: 0 }
  );
  const seps = sepData.separacoes || [];
  const skipNextRef = useRef(false);
  const lastSyncedAtRef = useRef(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, ...SEP_DOC.split('/')), (snap) => {
      if (!snap.exists()) return;
      const remote = snap.data() || {};
      if (skipNextRef.current && remote.updatedAt === lastSyncedAtRef.current) {
        skipNextRef.current = false;
        return;
      }
      const payload = {
        separacoes: Array.isArray(remote.separacoes) ? remote.separacoes : [],
        counter: Number(remote.counter || 0),
        updatedAt: Number(remote.updatedAt || Date.now()),
      };
      setSepData(payload);
      saveSepsCache(payload);
    }, (err) => console.warn('Separacoes onSnapshot:', err?.message));
    return () => unsub();
  }, []);

  // ── filtros ────────────────────────────────────────────────────────────────
  const [busca,      setBusca]      = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | status
  const [filtroForma,  setFiltroForma]  = useState('');
  const [filtroPor,    setFiltroPor]    = useState('');
  const [filtroDe,     setFiltroDe]     = useState('');
  const [filtroAte,    setFiltroAte]    = useState('');
  const [filtroDia,    setFiltroDia]    = useState(''); // '' | 'par' | 'impar'
  const [ordemCampo,   setOrdemCampo]   = useState('criadoEm'); // 'criadoEm' | 'status' | 'produto'
  const [ordemAsc,     setOrdemAsc]     = useState(false);
  const [showFiltros,  setShowFiltros]  = useState(false);

  // ── modais ─────────────────────────────────────────────────────────────────
  const [modalForm,    setModalForm]    = useState(false);
  const [modalEditar,  setModalEditar]  = useState(null);   // sep id
  const [modalHist,    setModalHist]    = useState(null);   // sep id
  const [modalConfirm, setModalConfirm] = useState(null);   // { tipo:'avancar'|'cancelar', id, para }
  const [expandidos,   setExpandidos]   = useState({});

  // ── form nova separação ────────────────────────────────────────────────────
  const [form, setForm] = useState(VAZIO_FORM);
  const [formEdit, setFormEdit] = useState(VAZIO_FORM);

  // ── persist ────────────────────────────────────────────────────────────────
  const persist = useCallback((arr, nextCounter = sepData.counter) => {
    const payload = {
      separacoes: arr,
      counter: Number(nextCounter || 0),
      updatedAt: Date.now(),
    };
    setSepData(payload);
    saveSepsCache(payload);
    skipNextRef.current = true;
    lastSyncedAtRef.current = payload.updatedAt;
    setDoc(doc(db, ...SEP_DOC.split('/')), payload)
      .catch((e) => console.warn('Separacoes setDoc:', e?.message));
  }, [sepData.counter]);

  // ── criar ──────────────────────────────────────────────────────────────────
  function handleCriar(e) {
    e.preventDefault();
    if (!form.produto.trim() || !form.quantidade) return;
    const agora = new Date().toISOString();
    const nextCounter = Number(sepData.counter || 0) + 1;
    const nova = {
      id: Date.now(),
      numero: `SEP-${String(nextCounter).padStart(4, '0')}`,
      produto: form.produto.trim(),
      quantidade: Number(form.quantidade),
      cor: form.cor.trim(),
      formaSaida: form.formaSaida,
      cliente: form.cliente.trim(),
      observacao: form.observacao.trim(),
      status: 'aguardando',
      criadoPor: user.nome,
      criadoEm: agora,
      historico: [{
        acao: 'Criado',
        statusDe: null, statusPara: 'aguardando',
        campos: [], por: user.nome, em: agora,
        obs: form.observacao.trim() || null,
      }],
    };
    persist([nova, ...seps], nextCounter);
    setForm(VAZIO_FORM);
    setModalForm(false);
  }

  // ── avançar status ─────────────────────────────────────────────────────────
  function confirmarAvancar() {
    const { id, para } = modalConfirm;
    const agora = new Date().toISOString();
    const actionLabel = para === 'separando' ? 'Separação iniciada' :
                        para === 'separado'  ? 'Marcado como separado' :
                        para === 'expedido'  ? 'Expedido' : 'Status alterado';
    persist(seps.map(s => {
      if (s.id !== id) return s;
      return {
        ...s, status: para,
        historico: [
          ...s.historico,
          { acao: actionLabel, statusDe: s.status, statusPara: para, campos: [], por: user.nome, em: agora },
        ],
      };
    }));
    setModalConfirm(null);
  }

  // ── cancelar ───────────────────────────────────────────────────────────────
  function confirmarCancelar() {
    const { id } = modalConfirm;
    const agora = new Date().toISOString();
    persist(seps.map(s => {
      if (s.id !== id) return s;
      return {
        ...s, status: 'cancelado',
        historico: [...s.historico, { acao: 'Cancelado', statusDe: s.status, statusPara: 'cancelado', campos: [], por: user.nome, em: agora }],
      };
    }));
    setModalConfirm(null);
  }

  // ── editar ─────────────────────────────────────────────────────────────────
  function abrirEditar(sep) {
    setFormEdit({ produto: sep.produto, quantidade: sep.quantidade, cor: sep.cor, formaSaida: sep.formaSaida, cliente: sep.cliente || '', observacao: sep.observacao || '' });
    setModalEditar(sep.id);
  }

  function handleEditar(e) {
    e.preventDefault();
    const agora = new Date().toISOString();
    const sep = seps.find(s => s.id === modalEditar);
    if (!sep) return;
    const campos = [];
    const campos_check = [
      { campo: 'Produto', de: sep.produto, para: formEdit.produto.trim() },
      { campo: 'Quantidade', de: String(sep.quantidade), para: String(formEdit.quantidade) },
      { campo: 'Cor', de: sep.cor, para: formEdit.cor.trim() },
      { campo: 'Forma de Saída', de: sep.formaSaida, para: formEdit.formaSaida },
      { campo: 'Cliente', de: sep.cliente || '', para: formEdit.cliente.trim() },
      { campo: 'Observação', de: sep.observacao || '', para: formEdit.observacao.trim() },
    ];
    campos_check.forEach(c => { if (c.de !== c.para) campos.push(c); });

    if (campos.length === 0) { setModalEditar(null); return; }

    persist(seps.map(s => {
      if (s.id !== modalEditar) return s;
      return {
        ...s,
        produto: formEdit.produto.trim(), quantidade: Number(formEdit.quantidade),
        cor: formEdit.cor.trim(), formaSaida: formEdit.formaSaida,
        cliente: formEdit.cliente.trim(), observacao: formEdit.observacao.trim(),
        historico: [...s.historico, { acao: 'Editado', statusDe: null, statusPara: null, campos, por: user.nome, em: agora }],
      };
    }));
    setModalEditar(null);
  }

  // ── filtro + ordenação ─────────────────────────────────────────────────────
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    let arr = seps.filter(s => {
      // Se não pode ver todas, filtra só as criadas pelo usuário logado
      if (!verTodas && s.criadoPor !== user?.nome) return false;
      if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false;
      if (filtroForma && s.formaSaida !== filtroForma) return false;
      if (filtroPor && !s.criadoPor.toLowerCase().includes(filtroPor.toLowerCase())) return false;
      if (filtroDia === 'par'   && !diaPar(s.criadoEm))   return false;
      if (filtroDia === 'impar' && !diaImpar(s.criadoEm)) return false;
      if (filtroDe) { const d = new Date(filtroDe); d.setHours(0,0,0,0); if (new Date(s.criadoEm) < d) return false; }
      if (filtroAte) { const d = new Date(filtroAte); d.setHours(23,59,59,999); if (new Date(s.criadoEm) > d) return false; }
      if (q) {
        const haystack = [s.numero, s.produto, s.cor, s.cliente, s.observacao, s.criadoPor].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      let cmp = 0;
      if (ordemCampo === 'criadoEm') cmp = new Date(a.criadoEm) - new Date(b.criadoEm);
      else if (ordemCampo === 'status') cmp = STATUS_LIST.indexOf(a.status) - STATUS_LIST.indexOf(b.status);
      else if (ordemCampo === 'produto') cmp = a.produto.localeCompare(b.produto, 'pt-BR');
      else if (ordemCampo === 'numero') cmp = a.numero.localeCompare(b.numero);
      return ordemAsc ? cmp : -cmp;
    });
    return arr;
  }, [seps, busca, filtroStatus, filtroForma, filtroPor, filtroDia, filtroDe, filtroAte, ordemCampo, ordemAsc, verTodas, user?.nome]);

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const obj = {};
    STATUS_LIST.forEach(st => { obj[st] = seps.filter(s => s.status === st).length; });
    return obj;
  }, [seps]);

  const totalAtivos = (stats.aguardando || 0) + (stats.separando || 0) + (stats.separado || 0);

  // ── helpers UI ─────────────────────────────────────────────────────────────
  const toggleExpand = (id) => setExpandidos(e => ({ ...e, [id]: !e[id] }));
  const limparFiltros = () => {
    setBusca(''); setFiltroStatus('todos'); setFiltroForma('');
    setFiltroPor(''); setFiltroDe(''); setFiltroAte(''); setFiltroDia('');
  };
  const filtrosAtivos = busca || filtroStatus !== 'todos' || filtroForma || filtroPor || filtroDe || filtroAte || filtroDia;

  const SortBtn = ({ campo, label }) => (
    <button
      onClick={() => { if (ordemCampo === campo) setOrdemAsc(a => !a); else { setOrdemCampo(campo); setOrdemAsc(false); } }}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition
        ${ordemCampo === campo ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
    >
      {label}
      {ordemCampo === campo
        ? (ordemAsc ? <LucideSortAsc className="w-3 h-3" /> : <LucideSortDesc className="w-3 h-3" />)
        : <span className="w-3 h-3 opacity-30">↕</span>}
    </button>
  );

  if (!podeVer) {
    return (
      <div className="p-10 text-center">
        <LucideAlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">Sem permissão para visualizar separações.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ══════════════════════════════════════════════════════ CABEÇALHO */}
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
              <LucideTruck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Separações & Reservas</h1>
              <p className="text-xs text-gray-400">Controle de separação de pedidos · rastreio completo</p>
            </div>
          </div>
          {podeCriar && (
            <button
              onClick={() => { setForm(VAZIO_FORM); setModalForm(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold shadow transition text-sm"
            >
              <LucidePlus className="w-4 h-4" /> Nova Separação
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-0">
          {[
            { key: 'todos',      label: 'Todos',     count: seps.length },
            ...STATUS_LIST.map(st => ({ key: st, label: STATUS_CFG[st].label, count: stats[st] || 0, cfg: STATUS_CFG[st] })),
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setFiltroStatus(item.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-medium whitespace-nowrap border-b-2 transition-all
                ${filtroStatus === item.key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {item.cfg && <span className={`w-2 h-2 rounded-full ${item.cfg.dot}`} />}
              {item.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-0.5
                ${filtroStatus === item.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">

        {/* ══════════════════════════════════════════════ BARRA DE BUSCA */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Busca texto */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="border rounded-xl pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="Buscar nº, produto, cor, cliente…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && <button onClick={() => setBusca('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><LucideX className="w-3.5 h-3.5"/></button>}
          </div>

          {/* Botão filtros avançados */}
          <button
            onClick={() => setShowFiltros(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition
              ${showFiltros || filtrosAtivos
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
          >
            <LucideFilter className="w-4 h-4" />
            Filtros
            {filtrosAtivos && !showFiltros && (
              <span className="bg-white/30 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">●</span>
            )}
          </button>

          {/* Ordenação */}
          <div className="flex items-center gap-1">
            <SortBtn campo="criadoEm" label="Data" />
            <SortBtn campo="status"   label="Status" />
            <SortBtn campo="produto"  label="Produto" />
            <SortBtn campo="numero"   label="Nº" />
          </div>

          {filtrosAtivos && (
            <button onClick={limparFiltros}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition">
              <LucideRefreshCw className="w-3 h-3" /> Limpar filtros
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════ FILTROS AVANÇADOS */}
        {showFiltros && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Forma de Saída */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Forma de Saída</label>
                <div className="flex flex-wrap gap-1">
                  {['', ...FORMAS_SAIDA].map(f => (
                    <button key={f} onClick={() => setFiltroForma(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition
                        ${filtroForma === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                      {f || 'Todas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dias pares/ímpares */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Dia de Criação</label>
                <div className="flex gap-1">
                  {[{v:'',l:'Todos'},{v:'par',l:'Pares'},{v:'impar',l:'Ímpares'}].map(d => (
                    <button key={d.v} onClick={() => setFiltroDia(d.v)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition
                        ${filtroDia === d.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Criado por */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Criado por</label>
                <input
                  className="border rounded-xl px-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Nome do usuário…"
                  value={filtroPor} onChange={e => setFiltroPor(e.target.value)}
                />
              </div>

              {/* Data de */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data inicial</label>
                <input type="date"
                  className="border rounded-xl px-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={filtroDe} onChange={e => setFiltroDe(e.target.value)}
                />
              </div>

              {/* Data até */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Data final</label>
                <input type="date"
                  className="border rounded-xl px-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={filtroAte} onChange={e => setFiltroAte(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ LISTA */}
        {totalAtivos > 0 && filtroStatus === 'todos' && !filtrosAtivos && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <LucideAlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              <strong>{totalAtivos}</strong> separaç{totalAtivos === 1 ? 'ão pendente' : 'ões pendentes'}
              {stats.aguardando > 0 && <> · <strong>{stats.aguardando}</strong> aguardando</>}
              {stats.separando > 0  && <> · <strong>{stats.separando}</strong> em separação</>}
              {stats.separado > 0   && <> · <strong>{stats.separado}</strong> separadas (aguardando expedição)</>}
            </p>
          </div>
        )}

        {lista.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <LucidePackage className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">Nenhuma separação encontrada</p>
            <p className="text-xs text-gray-300 mt-1">
              {podeCriar ? 'Clique em "Nova Separação" para criar a primeira.' : 'Nenhum resultado para os filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(sep => {
              const cfg = STATUS_CFG[sep.status] || STATUS_CFG.aguardando;
              const proximo = PROXIMO[sep.status];
              const expandido = !!expandidos[sep.id];
              const finalizado = sep.status === 'expedido' || sep.status === 'cancelado';

              return (
                <div key={sep.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-md ${cfg.border}`}>
                  {/* Linha principal */}
                  <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
                    {/* Número */}
                    <div className="flex flex-col min-w-[80px]">
                      <span className="text-[10px] text-gray-400 font-medium">Nº</span>
                      <span className="font-bold text-gray-800 text-sm">{sep.numero}</span>
                    </div>

                    {/* Status */}
                    <div className="min-w-[110px]">
                      <StatusBadge status={sep.status} />
                    </div>

                    {/* Produto */}
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-[10px] text-gray-400">Produto</span>
                      <p className="font-semibold text-gray-900 text-sm">{sep.produto}</p>
                    </div>

                    {/* Qtd + Cor */}
                    <div className="min-w-[60px]">
                      <span className="text-[10px] text-gray-400">Qtd</span>
                      <p className="font-bold text-gray-800 text-sm">{sep.quantidade.toLocaleString('pt-BR')}</p>
                    </div>

                    {sep.cor && (
                      <div className="min-w-[60px]">
                        <span className="text-[10px] text-gray-400">Cor</span>
                        <p className="text-sm text-gray-700">{sep.cor}</p>
                      </div>
                    )}

                    {/* Forma saída */}
                    <div>
                      <FormaBadge forma={sep.formaSaida} />
                    </div>

                    {/* Cliente */}
                    {sep.cliente && (
                      <div className="min-w-[80px]">
                        <span className="text-[10px] text-gray-400">Cliente</span>
                        <p className="text-xs text-gray-700 font-medium">{sep.cliente}</p>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="min-w-[100px]">
                      <span className="text-[10px] text-gray-400">Por / Em</span>
                      <p className="text-xs text-gray-600">{sep.criadoPor}</p>
                      <p className="text-[10px] text-gray-400">{fmtDate(sep.criadoEm)}</p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 flex-wrap">
                      {/* Avançar status */}
                      {podeAvancar && proximo && (
                        <button
                          onClick={() => setModalConfirm({ tipo: 'avancar', id: sep.id, de: sep.status, para: proximo, sep })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${cfg.btn}`}
                        >
                          {LABEL_AVANCO[sep.status]?.icon} {LABEL_AVANCO[sep.status]?.label}
                        </button>
                      )}

                      {/* Editar */}
                      {podeEditar && !finalizado && (
                        <button onClick={() => abrirEditar(sep)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                          <LucideEdit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Cancelar/Excluir — central atendimento + admin/ti/diretoria */}
                      {can.cancelarSeparacao && !finalizado && (
                        <button onClick={() => setModalConfirm({ tipo: 'cancelar', id: sep.id, sep })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition">
                          <LucideTrash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Histórico */}
                      <button onClick={() => setModalHist(sep.id)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition" title="Ver histórico">
                        <LucideHistory className="w-4 h-4" />
                      </button>

                      {/* Expandir obs */}
                      {(sep.observacao || sep.historico?.length > 1) && (
                        <button onClick={() => toggleExpand(sep.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                          {expandido ? <LucideChevronUp className="w-4 h-4" /> : <LucideChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandido: observação + última atualização */}
                  {expandido && (
                    <div className="px-5 pb-4 pt-0 border-t border-gray-100 mt-0 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        {sep.observacao && (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1">Observação</p>
                            <p className="text-sm text-gray-700 bg-white rounded-xl border px-3 py-2">{sep.observacao}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 mb-1">Última movimentação</p>
                          {(() => {
                            const ult = sep.historico?.[sep.historico.length - 1];
                            if (!ult) return <p className="text-xs text-gray-400">—</p>;
                            return (
                              <div className="bg-white rounded-xl border px-3 py-2 text-xs text-gray-600">
                                <span className="font-semibold">{ult.acao}</span> · {ult.por} · {fmtDT(ult.em)}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {lista.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            {lista.length} resultado{lista.length !== 1 ? 's' : ''} exibido{lista.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ MODAL CRIAR */}
      {modalForm && podeCriar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <LucidePlus className="w-5 h-5 text-indigo-500" /> Nova Solicitação de Separação
              </h2>
              <button onClick={() => setModalForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <LucideX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCriar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Produto */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Produto / Modelo *</label>
                  <input required
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Ex: DT 16mm PP, Cadeado 40mm…"
                    value={form.produto} onChange={e => setForm(f => ({...f, produto: e.target.value}))} />
                </div>

                {/* Quantidade */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Quantidade *</label>
                  <input required type="number" min="1"
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="0"
                    value={form.quantidade} onChange={e => setForm(f => ({...f, quantidade: e.target.value}))} />
                </div>

                {/* Cor */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Cor</label>
                  <input
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Ex: Amarelo, Preto…"
                    value={form.cor} onChange={e => setForm(f => ({...f, cor: e.target.value}))} />
                </div>

                {/* Forma de saída */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Forma de Saída *</label>
                  <div className="flex gap-2 flex-wrap">
                    {FORMAS_SAIDA.map(fs => (
                      <label key={fs}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border cursor-pointer font-semibold text-sm transition
                          ${form.formaSaida === fs ? `${FORMA_COR[fs]} font-bold shadow-sm` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <input type="radio" name="formaSaida" value={fs} checked={form.formaSaida === fs}
                          onChange={() => setForm(f => ({...f, formaSaida: fs}))} className="hidden" />
                        {fs}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cliente */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Cliente / Destino</label>
                  <input
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Nome do cliente ou destino"
                    value={form.cliente} onChange={e => setForm(f => ({...f, cliente: e.target.value}))} />
                </div>

                {/* Observação */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Observação</label>
                  <textarea rows={2}
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    placeholder="Informações adicionais, urgência…"
                    value={form.observacao} onChange={e => setForm(f => ({...f, observacao: e.target.value}))} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow transition">
                  Criar Separação
                </button>
                <button type="button" onClick={() => setModalForm(false)}
                  className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50 py-2.5 text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ MODAL EDITAR */}
      {modalEditar && podeEditar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <LucideEdit3 className="w-5 h-5 text-amber-500" /> Editar Separação
              </h2>
              <button onClick={() => setModalEditar(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <LucideX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEditar} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Produto / Modelo *</label>
                  <input required
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={formEdit.produto} onChange={e => setFormEdit(f=>({...f,produto:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Quantidade *</label>
                  <input required type="number" min="1"
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={formEdit.quantidade} onChange={e => setFormEdit(f=>({...f,quantidade:e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Cor</label>
                  <input
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={formEdit.cor} onChange={e => setFormEdit(f=>({...f,cor:e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Forma de Saída *</label>
                  <div className="flex gap-2 flex-wrap">
                    {FORMAS_SAIDA.map(fs => (
                      <label key={fs}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border cursor-pointer font-semibold text-sm transition
                          ${formEdit.formaSaida === fs ? `${FORMA_COR[fs]} font-bold shadow-sm` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <input type="radio" name="formaSaidaEdit" value={fs} checked={formEdit.formaSaida === fs}
                          onChange={() => setFormEdit(f=>({...f,formaSaida:fs}))} className="hidden" />
                        {fs}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Cliente / Destino</label>
                  <input
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    value={formEdit.cliente} onChange={e => setFormEdit(f=>({...f,cliente:e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Observação</label>
                  <textarea rows={2}
                    className="border rounded-xl px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    value={formEdit.observacao} onChange={e => setFormEdit(f=>({...f,observacao:e.target.value}))} />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <LucideInfo className="w-3 h-3" /> Todas as alterações ficam registradas no histórico com autor e horário.
              </p>
              <div className="flex gap-3">
                <button type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl shadow transition">
                  Salvar Alterações
                </button>
                <button type="button" onClick={() => setModalEditar(null)}
                  className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50 py-2.5 text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ MODAL HISTÓRICO */}
      {modalHist && (() => {
        const sep = seps.find(s => s.id === modalHist);
        if (!sep) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
                <div>
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <LucideHistory className="w-5 h-5 text-indigo-500" /> Histórico · {sep.numero}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{sep.produto} · Qtd {sep.quantidade}{sep.cor ? ` · ${sep.cor}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={sep.status} />
                  <button onClick={() => setModalHist(null)} className="p-1 hover:bg-gray-100 rounded-lg ml-2">
                    <LucideX className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
                <Timeline historico={[...(sep.historico || [])].reverse()} />
              </div>
              <div className="px-6 py-3 border-t bg-gray-50 rounded-b-2xl">
                <p className="text-[10px] text-gray-400 text-center">
                  {sep.historico?.length || 0} evento{sep.historico?.length !== 1 ? 's' : ''} registrado{sep.historico?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════ MODAL CONFIRMAÇÃO */}
      {modalConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            {modalConfirm.tipo === 'cancelar' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <LucideX className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Cancelar Separação?</h3>
                <p className="text-sm text-gray-500 mb-1">{modalConfirm.sep?.numero} · {modalConfirm.sep?.produto}</p>
                <p className="text-xs text-gray-400 mb-5">Essa ação ficará registrada no histórico.</p>
                <div className="flex gap-3">
                  <button onClick={confirmarCancelar}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition shadow">
                    Cancelar Separação
                  </button>
                  <button onClick={() => setModalConfirm(null)}
                    className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50 py-2.5 text-sm">
                    Voltar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <LucideCheckCircle className="w-7 h-7 text-indigo-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{LABEL_AVANCO[modalConfirm.de]?.label}?</h3>
                <p className="text-sm text-gray-500 mb-2">{modalConfirm.sep?.numero} · {modalConfirm.sep?.produto}</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <StatusBadge status={modalConfirm.de} />
                  <LucideArrowRight className="w-4 h-4 text-gray-400" />
                  <StatusBadge status={modalConfirm.para} />
                </div>
                <p className="text-xs text-gray-400 mb-5">Registrado com seu nome e horário atual.</p>
                <div className="flex gap-3">
                  <button onClick={confirmarAvancar}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition shadow">
                    Confirmar
                  </button>
                  <button onClick={() => setModalConfirm(null)}
                    className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50 py-2.5 text-sm">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
