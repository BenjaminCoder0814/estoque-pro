// Página de Sugestões — qualquer usuário pode registrar melhorias
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LucideLightbulb, LucidePlus, LucideX, LucideSend,
  LucideTag, LucideUser, LucideClock, LucideCheckCircle2,
  LucideCircleDashed, LucideXCircle,
} from 'lucide-react';

const SUGESTOES_KEY = 'zkSugestoes';

function loadSugestoes() {
  try { return JSON.parse(localStorage.getItem(SUGESTOES_KEY) || '[]'); } catch { return []; }
}
function saveSugestoes(lista) { localStorage.setItem(SUGESTOES_KEY, JSON.stringify(lista)); }

const CATEGORIAS = [
  { label: 'Sistema',      color: 'bg-blue-100   text-blue-700   border-blue-300'   },
  { label: 'Produto',      color: 'bg-green-100  text-green-700  border-green-300'  },
  { label: 'Processo',     color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { label: 'Usabilidade',  color: 'bg-cyan-100   text-cyan-700   border-cyan-300'   },
  { label: 'Segurança',    color: 'bg-red-100    text-red-700    border-red-300'    },
  { label: 'Outro',        color: 'bg-gray-100   text-gray-600   border-gray-300'   },
];

const STATUS_CONFIG = {
  PENDENTE:    { label: 'Pendente',    color: 'bg-gray-100   text-gray-600   border-gray-300',   icon: LucideCircleDashed  },
  EM_ANALISE:  { label: 'Em análise', color: 'bg-blue-100   text-blue-700   border-blue-300',   icon: LucideCircleDashed  },
  IMPLEMENTADA:{ label: 'Implementada',color: 'bg-green-100  text-green-700  border-green-300',  icon: LucideCheckCircle2  },
  REJEITADA:   { label: 'Rejeitada',  color: 'bg-red-100    text-red-700    border-red-300',    icon: LucideXCircle       },
};

const VAZIO = { titulo: '', descricao: '', categoria: 'Sistema' };

export default function Sugestoes() {
  const { user } = useAuth();
  const [sugestoes, setSugestoes] = useState(loadSugestoes);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(VAZIO);
  const [filtro, setFiltro]       = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [enviado, setEnviado]     = useState(false);

  const isAdmin = user?.perfil === 'ADMIN';

  function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim()) return;
    const nova = {
      id: Date.now(),
      ...form,
      status: 'PENDENTE',
      autor: user.nome,
      autorPerfil: user.perfil,
      criadoEm: new Date().toISOString(),
    };
    const lista = [nova, ...sugestoes];
    setSugestoes(lista);
    saveSugestoes(lista);
    setForm(VAZIO);
    setShowForm(false);
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3500);
  }

  const catMap = Object.fromEntries(CATEGORIAS.map(c => [c.label, c.color]));

  function atualizarStatus(id, novoStatus) {
    const nova = sugestoes.map(s => s.id === id ? { ...s, status: novoStatus } : s);
    setSugestoes(nova);
    saveSugestoes(nova);
  }

  const lista = sugestoes.filter(s =>
    (!filtro || s.categoria === filtro) &&
    (!filtroStatus || (s.status || 'PENDENTE') === filtroStatus)
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast sucesso */}
      {enviado && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold animate-fadein">
          💡 Sugestão enviada com sucesso!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
            <LucideLightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sugestões & Melhorias</h1>
            <p className="text-sm text-gray-500">Registre ideias para melhorar o sistema, processos ou produtos</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow transition"
        >
          <LucidePlus className="w-4 h-4" />
          Nova Sugestão
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6 mb-6 shadow-md animate-fadein">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <LucideLightbulb className="w-5 h-5 text-amber-500" />
              Registrar Sugestão
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <LucideX className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Título *</label>
              <input required maxLength={80}
                className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                placeholder="Resumo claro da sua ideia..."
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Categoria</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIAS.map(c => (
                  <button key={c.label} type="button"
                    onClick={() => setForm(f => ({ ...f, categoria: c.label }))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition
                      ${form.categoria === c.label ? 'ring-2 ring-offset-1 ring-amber-400 ' + c.color : c.color + ' opacity-60 hover:opacity-100'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Descrição *</label>
              <textarea required rows={5}
                className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
                placeholder="Descreva a melhoria, o problema que resolve, como deveria funcionar e qualquer detalhe importante..."
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow flex items-center gap-2 hover:opacity-90 transition">
                <LucideSend className="w-4 h-4" />
                Enviar Sugestão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros por categoria */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button onClick={() => setFiltro('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition
            ${filtro === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>
          Todas
        </button>
        {CATEGORIAS.map(c => (
          <button key={c.label} onClick={() => setFiltro(c.label)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition
              ${filtro === c.label ? c.color + ' ring-2 ring-offset-1 ring-amber-400' : c.color + ' opacity-60 hover:opacity-100'}`}>
            {c.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{lista.length} sugestão{lista.length !== 1 ? 'ões' : ''}</span>
      </div>

      {/* Filtro por status */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs text-gray-500 font-semibold">Status:</span>
        <button onClick={() => setFiltroStatus('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filtroStatus === '' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>
          Todos
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setFiltroStatus(key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${filtroStatus === key ? cfg.color + ' ring-2 ring-offset-1 ring-amber-400' : cfg.color + ' opacity-60 hover:opacity-100'}`}>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Lista de sugestões */}
      <div className="space-y-4">
        {lista.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <LucideLightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma sugestão ainda</p>
            <p className="text-sm mt-1">Seja o primeiro a registrar uma ideia!</p>
          </div>
        )}
        {lista.map(s => {
          const catColor = catMap[s.categoria] || 'bg-gray-100 text-gray-600 border-gray-300';
          const st = STATUS_CONFIG[s.status || 'PENDENTE'];
          const StatusIcon = st.icon;
          return (
            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold text-gray-900 text-base leading-tight">{s.titulo}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${st.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {st.label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${catColor}`}>
                    {s.categoria}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{s.descricao}</p>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <LucideUser className="w-3 h-3" />
                  {s.autor} <span className="ml-1 text-gray-300">({s.autorPerfil})</span>
                </span>
                <span className="flex items-center gap-1">
                  <LucideClock className="w-3 h-3" />
                  {new Date(s.criadoEm).toLocaleString('pt-BR')}
                </span>
                {isAdmin && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-gray-400 font-semibold">Alterar status:</span>
                    {Object.entries(STATUS_CONFIG).filter(([key]) => key !== (s.status || 'PENDENTE')).map(([key, cfg]) => (
                      <button key={key}
                        onClick={() => atualizarStatus(s.id, key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition hover:shadow-sm ${cfg.color}`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
