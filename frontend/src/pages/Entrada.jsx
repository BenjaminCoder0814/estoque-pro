// Página de Entrada — ADMIN e EXPEDICAO
// Pendentes: pedidos criados pelo COMPRAS via Alertas, aguardando chegada física
// Realizadas: entradas já confirmadas com atualização de estoque
import React, { useState, useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LucidePackageCheck, LucideClipboardList, LucideCheck,
  LucideX, LucideClock, LucideBoxes, LucidePlus,
} from 'lucide-react';

const PENDENTES_KEY = 'zkPendentes';
function loadPendentes() {
  try { return JSON.parse(localStorage.getItem(PENDENTES_KEY) || '[]'); } catch { return []; }
}
function savePendentes(lista) { localStorage.setItem(PENDENTES_KEY, JSON.stringify(lista)); }

export default function Entrada() {
  const { produtos, editarProduto } = useEstoque();
  const { user } = useAuth();

  const [pendentes, setPendentes] = useState(loadPendentes);
  const [aba, setAba] = useState('pendentes');

  // Modal confirmar chegada de pedido pendente
  const [modalPedido, setModalPedido] = useState(null);
  const [formConfirmar, setFormConfirmar] = useState({ quantidade: '', cor: '', observacao: '' });

  // Modal entrada direta (sem pedido prévio)
  const [showDireta, setShowDireta] = useState(false);
  const [formDireta, setFormDireta] = useState({ produtoId: '', quantidade: '', cor: '', observacao: '' });

  const pendentesAtivos = useMemo(
    () => [...pendentes.filter(p => p.status === 'PENDENTE')].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)),
    [pendentes]
  );
  const realizadas = useMemo(
    () => [...pendentes.filter(p => p.status === 'REALIZADA')].sort((a, b) => new Date(b.realizadaEm) - new Date(a.realizadaEm)),
    [pendentes]
  );

  function abrirConfirmar(pedido) {
    setFormConfirmar({ quantidade: String(pedido.quantidadePedida || ''), cor: '', observacao: '' });
    setModalPedido(pedido);
  }

  function confirmarEntrada(e) {
    e.preventDefault();
    const qtd = Number(formConfirmar.quantidade);
    if (!qtd || qtd < 1) return;
    const pedido = modalPedido;
    const produto = produtos.find(p => p.id === pedido.produtoId);
    if (produto) {
      const atualizado = {
        ...produto,
        estoqueAtual: produto.estoqueAtual + qtd,
        ...(formConfirmar.cor ? { cor: formConfirmar.cor } : {}),
      };
      editarProduto(produto.id, atualizado, user);
    }
    const nova = pendentes.map(p =>
      p.id === pedido.id
        ? {
            ...p, status: 'REALIZADA',
            realizadaEm: new Date().toISOString(),
            realizadaPor: user.nome,
            quantidadeRecebida: qtd,
            corRecebida: formConfirmar.cor,
            observacaoEntrada: formConfirmar.observacao,
          }
        : p
    );
    setPendentes(nova);
    savePendentes(nova);
    setModalPedido(null);
  }

  function salvarEntradaDireta(e) {
    e.preventDefault();
    const qtd = Number(formDireta.quantidade);
    if (!formDireta.produtoId || !qtd || qtd < 1) return;
    const produto = produtos.find(p => p.id === formDireta.produtoId);
    if (!produto) return;
    const atualizado = {
      ...produto,
      estoqueAtual: produto.estoqueAtual + qtd,
      ...(formDireta.cor ? { cor: formDireta.cor } : {}),
    };
    editarProduto(produto.id, atualizado, user);
    const registro = {
      id: Date.now(),
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoCodigo: produto.codigo,
      produtoCategoria: produto.categoria,
      quantidadePedida: qtd,
      quantidadeRecebida: qtd,
      autor: user.nome,
      autorPerfil: user.perfil,
      criadoEm: new Date().toISOString(),
      status: 'REALIZADA',
      realizadaEm: new Date().toISOString(),
      realizadaPor: user.nome,
      corRecebida: formDireta.cor,
      observacaoEntrada: formDireta.observacao,
      entradaDireta: true,
    };
    const nova = [registro, ...pendentes];
    setPendentes(nova);
    savePendentes(nova);
    setShowDireta(false);
    setFormDireta({ produtoId: '', quantidade: '', cor: '', observacao: '' });
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
            <LucidePackageCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entrada de Mercadoria</h1>
            <p className="text-sm text-gray-500">Confirme chegadas e atualize o estoque</p>
          </div>
        </div>
        <button
          onClick={() => { setShowDireta(true); setFormDireta({ produtoId: '', quantidade: '', cor: '', observacao: '' }); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow transition"
        >
          <LucidePlus className="w-4 h-4" />
          Nova Entrada
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setAba('pendentes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${aba === 'pendentes' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <LucideClock className="w-4 h-4" />
          Pedidos Pendentes
          {pendentesAtivos.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendentesAtivos.length}</span>
          )}
        </button>
        <button
          onClick={() => setAba('realizadas')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${aba === 'realizadas' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <LucideCheck className="w-4 h-4" />
          Entradas Realizadas
          <span className="bg-gray-300 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{realizadas.length}</span>
        </button>
      </div>

      {/* ── ABA PENDENTES ─────────────────────────────────────── */}
      {aba === 'pendentes' && (
        <div className="space-y-4">
          {pendentesAtivos.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <LucideClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Nenhum pedido pendente</p>
              <p className="text-sm text-gray-400 mt-1">Os pedidos marcados pela equipe de Compras aparecerão aqui.</p>
            </div>
          ) : pendentesAtivos.map(pedido => {
            const produto = produtos.find(p => p.id === pedido.produtoId);
            return (
              <div key={pedido.id} className="bg-white border border-orange-200 rounded-2xl p-5 shadow-sm flex gap-4 items-start">
                {produto?.imagem
                  ? <img src={produto.imagem} alt={produto.nome} className="w-16 h-16 object-contain rounded-xl border flex-shrink-0" />
                  : <div className="w-16 h-16 bg-orange-50 rounded-xl border border-orange-200 flex items-center justify-center text-orange-300 flex-shrink-0"><LucideBoxes className="w-6 h-6" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{pedido.produtoNome}</h3>
                      <p className="text-xs text-gray-400">{pedido.produtoCodigo} · {pedido.produtoCategoria}</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full border border-orange-200">
                      ⏳ Aguardando chegada
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Qtd pedida</span>
                      <p className="font-bold text-lg text-orange-600">{pedido.quantidadePedida}</p>
                    </div>
                    {produto && (
                      <div>
                        <span className="text-gray-400 text-xs">Estoque atual</span>
                        <p className="font-bold text-lg text-gray-700">{produto.estoqueAtual}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-xs">Pedido por</span>
                      <p className="font-semibold text-gray-700">{pedido.autor}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Data</span>
                      <p className="font-semibold text-gray-700">{new Date(pedido.criadoEm).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  {pedido.observacaoPedido && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                      💬 <span className="font-medium">Obs. do pedido:</span> {pedido.observacaoPedido}
                    </div>
                  )}
                  <button
                    onClick={() => abrirConfirmar(pedido)}
                    className="mt-3 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition"
                  >
                    <LucideCheck className="w-4 h-4" />
                    Confirmar Chegada
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ABA REALIZADAS ────────────────────────────────────── */}
      {aba === 'realizadas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {realizadas.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <LucideCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma entrada realizada ainda</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-center">Qtd Recebida</th>
                  <th className="p-3 text-left">Cor</th>
                  <th className="p-3 text-left">Observação</th>
                  <th className="p-3 text-left">Realizado por</th>
                  <th className="p-3 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {realizadas.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-gray-800">{r.produtoNome}</p>
                      <p className="text-xs text-gray-400">{r.produtoCodigo}</p>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-sm">
                        +{r.quantidadeRecebida}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{r.corRecebida || <span className="text-gray-300">—</span>}</td>
                    <td className="p-3 text-gray-500 max-w-[200px] truncate">{r.observacaoEntrada || <span className="text-gray-300">—</span>}</td>
                    <td className="p-3 text-gray-600">{r.realizadaPor}</td>
                    <td className="p-3 text-gray-400">{new Date(r.realizadaEm).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODAL CONFIRMAR CHEGADA ───────────────────────────── */}
      {modalPedido && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucidePackageCheck className="w-5 h-5 text-emerald-600" />
                Confirmar Chegada
              </h2>
              <button onClick={() => setModalPedido(null)} className="text-gray-400 hover:text-gray-600">
                <LucideX className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <p className="font-semibold text-gray-700">{modalPedido.produtoNome}</p>
              <p className="text-gray-400 text-xs">{modalPedido.produtoCodigo} · Pedido: {modalPedido.quantidadePedida} unid.</p>
            </div>
            <form onSubmit={confirmarEntrada} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Quantidade Recebida *</label>
                <input
                  required type="number" min="1"
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  value={formConfirmar.quantidade}
                  onChange={e => setFormConfirmar(f => ({ ...f, quantidade: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Cor (opcional)</label>
                <input
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  placeholder="ex: Amarelo, Azul..."
                  value={formConfirmar.cor}
                  onChange={e => setFormConfirmar(f => ({ ...f, cor: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Observação (opcional)</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 resize-none"
                  placeholder="NF, condição do produto, divergência..."
                  value={formConfirmar.observacao}
                  onChange={e => setFormConfirmar(f => ({ ...f, observacao: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setModalPedido(null)} className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow flex items-center gap-2">
                  <LucideCheck className="w-4 h-4" /> Confirmar e Atualizar Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA ENTRADA DIRETA ─────────────────────────── */}
      {showDireta && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucidePlus className="w-5 h-5 text-emerald-600" />
                Nova Entrada
              </h2>
              <button onClick={() => setShowDireta(false)} className="text-gray-400 hover:text-gray-600">
                <LucideX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvarEntradaDireta} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Produto *</label>
                <select
                  required
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  value={formDireta.produtoId}
                  onChange={e => setFormDireta(f => ({ ...f, produtoId: e.target.value }))}
                >
                  <option value="">Selecione o produto...</option>
                  {produtos.filter(p => p.ativo).sort((a, b) => a.nome.localeCompare(b.nome)).map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — estoque: {p.estoqueAtual}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Quantidade *</label>
                <input
                  required type="number" min="1"
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  value={formDireta.quantidade}
                  onChange={e => setFormDireta(f => ({ ...f, quantidade: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Cor (opcional)</label>
                <input
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  placeholder="ex: Amarelo, Azul..."
                  value={formDireta.cor}
                  onChange={e => setFormDireta(f => ({ ...f, cor: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Observação (opcional)</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 resize-none"
                  placeholder="NF, informações da chegada..."
                  value={formDireta.observacao}
                  onChange={e => setFormDireta(f => ({ ...f, observacao: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setShowDireta(false)} className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow flex items-center gap-2">
                  <LucideCheck className="w-4 h-4" /> Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
