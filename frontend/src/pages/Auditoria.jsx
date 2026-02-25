// Auditoria — Contagem física de estoque + registro de ações do sistema
import React, { useState, useEffect } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import {
  LucideClipboardList, LucideHistory, LucideCheckCircle2,
  LucideAlertCircle, LucideCalculator, LucideSearch, LucideTag,
} from 'lucide-react';

const CONTAGENS_KEY = 'zkContagens';
function loadContagens() {
  try { return JSON.parse(localStorage.getItem(CONTAGENS_KEY) || '[]'); } catch { return []; }
}
function saveContagens(lista) { localStorage.setItem(CONTAGENS_KEY, JSON.stringify(lista)); }

export default function Auditoria() {
  const { produtos, auditoria } = useEstoque();
  const { user, can } = useAuth();

  const [aba, setAba]                   = useState('contagem'); // 'contagem' | 'logs' | 'historico' | 'historico_precos'
  const [buscaCont, setBuscaCont]       = useState('');
  const [contagens, setContagens]       = useState(loadContagens);
  // contagem atual em andamento: { produtoId: qtdFisica }
  const [contagemAtual, setContagemAtual] = useState({});
  const [contagemSalva, setContagemSalva] = useState(false);
  // log actions
  const [busca, setBusca]               = useState('');
  const [filtroAcao, setFiltroAcao]     = useState('');
  const [expandido, setExpandido]       = useState(null);
  // histórico de preços (Firebase)
  const [historicoPrecos, setHistoricoPrecos]   = useState([]);
  const [buscaPrecos, setBuscaPrecos]           = useState('');
  const [filtroAcaoPrecos, setFiltroAcaoPrecos] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'historico_precos'), orderBy('timestamp', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => {
      setHistoricoPrecos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  if (!can.verAuditoria) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-red-500">Acesso restrito</p>
        <p className="text-gray-500 mt-1">Somente o Administrador pode acessar a auditoria.</p>
      </div>
    );
  }

  // ── ABA CONTAGEM ───────────────────────────
  const produtosFiltrados = produtos
    .filter(p => p.ativo)
    .filter(p => !buscaCont ||
      p.nome.toLowerCase().includes(buscaCont.toLowerCase()) ||
      p.categoria.toLowerCase().includes(buscaCont.toLowerCase())
    );

  function setQtdFisica(id, valor) {
    setContagemAtual(prev => ({ ...prev, [id]: valor === '' ? '' : Number(valor) }));
    setContagemSalva(false);
  }

  function calcDivergencia(p) {
    const fisico = contagemAtual[p.id];
    if (fisico === '' || fisico === undefined) return null;
    return Number(fisico) - p.estoqueAtual;
  }

  function finalizarContagem() {
    const itens = produtosFiltrados
      .filter(p => contagemAtual[p.id] !== undefined && contagemAtual[p.id] !== '')
      .map(p => {
        const fisico = Number(contagemAtual[p.id]);
        return {
          produtoId:   p.id,
          produto:     p.nome,
          categoria:   p.categoria,
          sistemaQtd:  p.estoqueAtual,
          fisicoQtd:   fisico,
          diferenca:   fisico - p.estoqueAtual,
        };
      });

    if (itens.length === 0) return;

    const registro = {
      id: Date.now(),
      realizadoPor: user.nome,
      realizadoEm: new Date().toISOString(),
      totalContados: itens.length,
      divergencias: itens.filter(i => i.diferenca !== 0).length,
      itens,
    };

    const nova = [registro, ...contagens];
    setContagens(nova);
    saveContagens(nova);
    setContagemAtual({});
    setContagemSalva(true);
    setTimeout(() => setContagemSalva(false), 4000);
  }

  const totalContados   = Object.values(contagemAtual).filter(v => v !== '').length;
  const totalDivergentes = produtosFiltrados.filter(p => {
    const d = calcDivergencia(p);
    return d !== null && d !== 0;
  }).length;

  // ── ABA LOGS ───────────────────────────────
  const acoes = [...new Set(auditoria.map(a => a.acao))];
  const listaLogs = auditoria
    .filter(a =>
      (!busca || a.usuario.toLowerCase().includes(busca.toLowerCase()) ||
        a.entidade.toLowerCase().includes(busca.toLowerCase())) &&
      (!filtroAcao || a.acao === filtroAcao)
    )
    .slice()
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  function formatJSON(str) {
    try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
  }

  const corAcao = {
    CRIACAO:       'bg-green-100 text-green-700',
    EDICAO:        'bg-blue-100 text-blue-700',
    EXCLUSAO:      'bg-red-100 text-red-700',
    MOVIMENTACAO:  'bg-purple-100 text-purple-700',
    LOGIN:         'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <LucideClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-sm text-gray-500">Contagem física de estoque e registro de ações do sistema</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'contagem',         label: 'Contagem de Estoque',    icon: LucideCalculator    },
          { id: 'logs',             label: 'Registro de Ações',        icon: LucideHistory        },
          { id: 'historico',        label: 'Histórico de Contagens',  icon: LucideClipboardList  },
          { id: 'historico_precos', label: 'Histórico de Preços',     icon: LucideTag            },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAba(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
              ${aba === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── CONTAGEM ───────────────────────── */}
      {aba === 'contagem' && (
        <div>
          {contagemSalva && (
            <div className="mb-4 bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadein">
              <LucideCheckCircle2 className="w-5 h-5" />
              Contagem finalizada e salva com sucesso!
            </div>
          )}

          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-5 text-sm text-cyan-800">
            <strong>Como funciona:</strong> Digite a quantidade física encontrada para cada produto.
            O sistema compara com o estoque no sistema e destaca as divergências.
            Ao finalizar, o registro é salvo com data, hora e responsável.
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="pl-9 pr-3 py-2 border rounded-xl text-sm w-full focus:ring-2 focus:ring-indigo-300"
                placeholder="Buscar produto ou categoria..."
                value={buscaCont}
                onChange={e => setBuscaCont(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                {totalContados} contados
              </span>
              {totalDivergentes > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <LucideAlertCircle className="w-3.5 h-3.5" />
                  {totalDivergentes} divergências
                </span>
              )}
            </div>
            {totalContados > 0 && (
              <button onClick={finalizarContagem}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl text-sm font-semibold shadow hover:opacity-90 transition">
                ✓ Finalizar Contagem
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-left">Categoria</th>
                  <th className="p-3 text-center">Qtd Sistema</th>
                  <th className="p-3 text-center w-40">Qtd Física</th>
                  <th className="p-3 text-center">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(p => {
                  const div = calcDivergencia(p);
                  const temDiv = div !== null && div !== 0;
                  return (
                    <tr key={p.id}
                      className={`border-t text-sm transition
                        ${temDiv ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-medium text-gray-900">{p.nome}</td>
                      <td className="p-3 text-gray-500 text-xs">{p.categoria}</td>
                      <td className="p-3 text-center font-bold text-gray-700">{p.estoqueAtual}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number" min="0"
                          className={`w-24 border rounded-lg px-2 py-1.5 text-center text-sm font-semibold focus:ring-2 transition
                            ${temDiv ? 'border-red-400 text-red-700 focus:ring-red-300' :
                              div === 0 ? 'border-green-400 text-green-700 focus:ring-green-300' :
                              'border-gray-300 focus:ring-indigo-300'}`}
                          value={contagemAtual[p.id] ?? ''}
                          onChange={e => setQtdFisica(p.id, e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td className="p-3 text-center">
                        {div === null ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : div === 0 ? (
                          <span className="flex items-center justify-center gap-1 text-green-600 text-xs font-semibold">
                            <LucideCheckCircle2 className="w-4 h-4" /> OK
                          </span>
                        ) : (
                          <span className={`font-bold text-sm ${div > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {div > 0 ? '+' : ''}{div}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {produtosFiltrados.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-8 text-gray-400">Nenhum produto encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REGISTRO DE AÇÕES ─────────────── */}
      {aba === 'logs' && (
        <div>
          <div className="flex gap-3 mb-5 flex-wrap">
            <input className="border rounded-lg px-3 py-2 text-sm w-56"
              placeholder="Buscar por usuário ou entidade..."
              value={busca} onChange={e => setBusca(e.target.value)} />
            <select className="border rounded-lg px-3 py-2 text-sm"
              value={filtroAcao} onChange={e => setFiltroAcao(e.target.value)}>
              <option value="">Todas as ações</option>
              {acoes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-3 text-left">Usuário</th>
                  <th className="p-3 text-left">Perfil</th>
                  <th className="p-3 text-left">Entidade</th>
                  <th className="p-3 text-left">Ação</th>
                  <th className="p-3 text-left">Data/Hora</th>
                  <th className="p-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {listaLogs.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-gray-400">Nenhum registro.</td></tr>
                )}
                {listaLogs.map(a => (
                  <React.Fragment key={a.id}>
                    <tr className="border-t text-sm hover:bg-gray-50 transition">
                      <td className="p-3 font-medium">{a.usuario}</td>
                      <td className="p-3 text-gray-500 text-xs">{a.perfil}</td>
                      <td className="p-3 text-gray-600">{a.entidade}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${corAcao[a.acao] || 'bg-gray-100 text-gray-600'}`}>
                          {a.acao}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(a.criadoEm).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-center">
                        {(a.antes || a.depois) && (
                          <button onClick={() => setExpandido(expandido === a.id ? null : a.id)}
                            className="text-blue-500 hover:underline text-xs">
                            {expandido === a.id ? 'Ocultar' : 'Ver'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandido === a.id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {a.antes && (
                              <div>
                                <p className="font-semibold text-gray-600 mb-1">Antes:</p>
                                <pre className="bg-white border rounded p-2 overflow-auto max-h-48 text-gray-700">{formatJSON(a.antes)}</pre>
                              </div>
                            )}
                            {a.depois && (
                              <div>
                                <p className="font-semibold text-gray-600 mb-1">Depois:</p>
                                <pre className="bg-white border rounded p-2 overflow-auto max-h-48 text-gray-700">{formatJSON(a.depois)}</pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">{listaLogs.length} registro(s)</p>
        </div>
      )}

      {/* ── HISTÓRICO DE CONTAGENS ─────────── */}
      {aba === 'historico' && (
        <div className="space-y-4">
          {contagens.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <LucideClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma contagem realizada ainda.</p>
            </div>
          )}
          {contagens.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 border-b bg-gray-50">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    Contagem de {new Date(c.realizadoEm).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Por: {c.realizadoPor} | {c.totalContados} produto(s) auditado(s)
                  </p>
                </div>
                {c.divergencias > 0 ? (
                  <span className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded-full text-xs font-bold">
                    {c.divergencias} divergência(s)
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded-full text-xs font-bold">
                    Sem divergências
                  </span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white text-gray-500 text-xs uppercase">
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-center">Categoria</th>
                    <th className="p-3 text-center">Sistema</th>
                    <th className="p-3 text-center">Físico</th>
                    <th className="p-3 text-center">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {c.itens.map((item, i) => (
                    <tr key={i} className={`border-t ${item.diferenca !== 0 ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-medium">{item.produto}</td>
                      <td className="p-3 text-center text-gray-500 text-xs">{item.categoria}</td>
                      <td className="p-3 text-center text-gray-700 font-bold">{item.sistemaQtd}</td>
                      <td className="p-3 text-center text-gray-700 font-bold">{item.fisicoQtd}</td>
                      <td className={`p-3 text-center font-bold ${item.diferenca > 0 ? 'text-blue-600' : item.diferenca < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.diferenca > 0 ? '+' : ''}{item.diferenca}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {/* ── HISTÓRICO DE PREÇOS (Firebase) ─── */}
      {aba === 'historico_precos' && (
        <div>
          <div className="flex gap-3 mb-5 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="pl-9 pr-3 py-2 border rounded-xl text-sm w-full focus:ring-2 focus:ring-purple-300"
                placeholder="Buscar por usuário ou descrição..."
                value={buscaPrecos}
                onChange={e => setBuscaPrecos(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={filtroAcaoPrecos}
              onChange={e => setFiltroAcaoPrecos(e.target.value)}
            >
              <option value="">Todas as ações</option>
              {[...new Set(historicoPrecos.map(h => h.acao))].map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-3 text-left">Usuário</th>
                  <th className="p-3 text-left">Perfil</th>
                  <th className="p-3 text-left">Ação</th>
                  <th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-left">Data/Hora</th>
                  <th className="p-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {historicoPrecos
                  .filter(h =>
                    (!buscaPrecos || h.usuario?.toLowerCase().includes(buscaPrecos.toLowerCase()) ||
                      h.descricao?.toLowerCase().includes(buscaPrecos.toLowerCase())) &&
                    (!filtroAcaoPrecos || h.acao === filtroAcaoPrecos)
                  )
                  .map(h => {
                    const corAcaoP = {
                      CRIAR_CATEGORIA:  'bg-green-100 text-green-700',
                      EDITAR_CATEGORIA: 'bg-blue-100 text-blue-700',
                      EXCLUIR_CATEGORIA:'bg-red-100 text-red-700',
                      CRIAR_PRODUTO:    'bg-green-100 text-green-700',
                      EDITAR_PRODUTO:   'bg-blue-100 text-blue-700',
                      EXCLUIR_PRODUTO:  'bg-red-100 text-red-700',
                      CRIAR_VARIACAO:   'bg-emerald-100 text-emerald-700',
                      EDITAR_VARIACAO:  'bg-indigo-100 text-indigo-700',
                      EXCLUIR_VARIACAO: 'bg-rose-100 text-rose-700',
                    };
                    return (
                      <React.Fragment key={h.id}>
                        <tr className="border-t text-sm hover:bg-gray-50 transition">
                          <td className="p-3 font-medium">{h.usuario}</td>
                          <td className="p-3 text-gray-500 text-xs">{h.perfil}</td>
                          <td className="p-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${corAcaoP[h.acao] ?? 'bg-gray-100 text-gray-600'}`}>
                              {h.acao?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-gray-700 text-xs">{h.descricao}</td>
                          <td className="p-3 text-gray-400 text-xs">
                            {h.timestamp ? new Date(h.timestamp).toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="p-3 text-center">
                            {(h.antes || h.depois) && (
                              <button
                                onClick={() => setExpandido(expandido === h.id ? null : h.id)}
                                className="text-purple-500 hover:underline text-xs"
                              >
                                {expandido === h.id ? 'Ocultar' : 'Ver'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandido === h.id && (
                          <tr className="bg-gray-50 border-b">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                {h.antes && (
                                  <div>
                                    <p className="font-semibold text-gray-600 mb-1">Antes:</p>
                                    <pre className="bg-white border rounded p-2 overflow-auto max-h-48 text-gray-700">
                                      {JSON.stringify(JSON.parse(h.antes), null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {h.depois && (
                                  <div>
                                    <p className="font-semibold text-gray-600 mb-1">Depois:</p>
                                    <pre className="bg-white border rounded p-2 overflow-auto max-h-48 text-gray-700">
                                      {JSON.stringify(JSON.parse(h.depois), null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                {historicoPrecos.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-gray-400">Nenhum registro ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">{historicoPrecos.length} registro(s)</p>
        </div>
      )}
    </div>
  );
}
