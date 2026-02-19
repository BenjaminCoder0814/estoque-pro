// Página de ENTRADA — ADMIN e EXPEDICAO
// Fluxo: COMPRAS marca pedido nos Alertas → pedido aparece aqui → EXPEDICAO confirma chegada
// Divergência: qty recebida ≠ qty pedida → notifica ADMIN + COMPRAS
import React, { useState, useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LucidePackageCheck, LucideClipboardList, LucideCheck,
  LucideX, LucideClock, LucideBoxes, LucidePlus, LucideAlertTriangle,
  LucideCheckCircle, LucideHistory,
} from 'lucide-react';

const PENDENTES_KEY = 'zkPendentes';
const NOTIF_KEY     = 'zkNotificacoes';

function loadPendentes() {
  try { return JSON.parse(localStorage.getItem(PENDENTES_KEY) || '[]'); } catch { return []; }
}
function savePendentes(lista) { localStorage.setItem(PENDENTES_KEY, JSON.stringify(lista)); }

function addNotificacao(msg, tipo = 'alerta') {
  try {
    const lista = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    lista.unshift({ id: Date.now(), mensagem: msg, tipo, lida: false, criadoEm: new Date().toISOString() });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(lista.slice(0, 100)));
  } catch {}
}

export default function Entrada() {
  const { produtos, editarProduto } = useEstoque();
  const { user } = useAuth();

  const [pendentes, setPendentes] = useState(loadPendentes);
  const [aba, setAba] = useState('pendentes');
  const [toast, setToast] = useState(null);

  // Modal confirmar chegada de pedido pendente
  const [modalPedido, setModalPedido] = useState(null);
  const [formConfirmar, setFormConfirmar] = useState({ quantidade: '', cor: '', observacao: '', data: '', hora: '' });

  // Modal entrada direta (sem pedido prévio)
  const [showDireta, setShowDireta] = useState(false);
  const [formDireta, setFormDireta] = useState({ produtoId: '', quantidade: '', cor: '', observacao: '' });

  const pendentesAtivos = useMemo(
    () => [...pendentes.filter(p => p.status === 'PENDENTE')].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)),
    [pendentes]
  );
  const historico = useMemo(
    () => [...pendentes.filter(p => ['RECEBIDO','DIVERGENCIA','REALIZADA'].includes(p.status))]
            .sort((a, b) => new Date(b.realizadaEm || b.criadoEm) - new Date(a.realizadaEm || a.criadoEm)),
    [pendentes]
  );

  function mostrarToast(msg, tipo = 'ok') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  function abrirConfirmar(pedido) {
    const agora = new Date();
    const dataHoje = agora.toISOString().slice(0, 10);
    const horaAgora = agora.toTimeString().slice(0, 5);
    setFormConfirmar({ quantidade: String(pedido.quantidadePedida || ''), cor: '', observacao: '', data: dataHoje, hora: horaAgora });
    setModalPedido(pedido);
  }

  function confirmarEntrada(e) {
    e.preventDefault();
    const qtdRecebida = Number(formConfirmar.quantidade);
    if (!qtdRecebida || qtdRecebida < 1) return;
    const pedido = modalPedido;

    // Atualiza estoque
    const produto = produtos.find(p => p.id === pedido.produtoId);
    if (produto) {
      const atualizado = {
        ...produto,
        estoqueAtual: produto.estoqueAtual + qtdRecebida,
        ...(formConfirmar.cor ? { cor: formConfirmar.cor } : {}),
      };
      editarProduto(produto.id, atualizado, user);
    }

    const isDivergencia = qtdRecebida !== pedido.quantidadePedida;
    const novoStatus = isDivergencia ? 'DIVERGENCIA' : 'RECEBIDO';
    const realizadaEm = formConfirmar.data && formConfirmar.hora
      ? new Date(`${formConfirmar.data}T${formConfirmar.hora}`).toISOString()
      : new Date().toISOString();

    const nova = pendentes.map(p =>
      p.id === pedido.id
        ? {
            ...p,
            status: novoStatus,
            realizadaEm,
            realizadaPor: user.nome,
            quantidadeRecebida: qtdRecebida,
            corRecebida: formConfirmar.cor,
            observacaoEntrada: formConfirmar.observacao,
          }
        : p
    );
    setPendentes(nova);
    savePendentes(nova);

    if (isDivergencia) {
      const diff = qtdRecebida - pedido.quantidadePedida;
      const msg = `⚠️ DIVERGÊNCIA na entrada de "${pedido.produtoNome}": pedido ${pedido.quantidadePedida} unid., recebido ${qtdRecebida} unid. (${diff > 0 ? '+' : ''}${diff}). Registrado por ${user.nome}.`;
      addNotificacao(msg, 'divergencia');
      mostrarToast(`Divergência registrada! Qtd pedida: ${pedido.quantidadePedida} · Recebida: ${qtdRecebida}. Admin e Compras foram notificados.`, 'warn');
    } else {
      mostrarToast(`✅ "${pedido.produtoNome}" recebido com sucesso! Estoque atualizado.`, 'ok');
    }

    setModalPedido(null);
  }

  function salvarEntradaDireta(e) {
    e.preventDefault();
    const qtd = Number(formDireta.quantidade);
    if (!formDireta.produtoId || !qtd || qtd < 1) return;
    const produto = produtos.find(p => p.id === formDireta.produtoId);
    if (!produto) return;
    editarProduto(produto.id, {
      ...produto,
      estoqueAtual: produto.estoqueAtual + qtd,
      ...(formDireta.cor ? { cor: formDireta.cor } : {}),
    }, user);
    const registro = {
      id: Date.now(),
      produtoId: produto.id, produtoNome: produto.nome,
      produtoCodigo: produto.codigo, produtoCategoria: produto.categoria,
      quantidadePedida: qtd, quantidadeRecebida: qtd,
      autor: user.nome, autorPerfil: user.perfil,
      criadoEm: new Date().toISOString(),
      status: 'RECEBIDO',
      realizadaEm: new Date().toISOString(), realizadaPor: user.nome,
      corRecebida: formDireta.cor, observacaoEntrada: formDireta.observacao,
      entradaDireta: true,
    };
    const nova = [registro, ...pendentes];
    setPendentes(nova);
    savePendentes(nova);
    setShowDireta(false);
    setFormDireta({ produtoId: '', quantidade: '', cor: '', observacao: '' });
    mostrarToast(`✅ Entrada direta de ${qtd}x "${produto.nome}" registrada!`, 'ok');
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-semibold flex items-center gap-2 text-sm transition-all
          ${toast.tipo === 'ok' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
          {toast.tipo === 'ok'
            ? <LucideCheckCircle className="w-4 h-4 flex-shrink-0" />
            : <LucideAlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
            <LucidePackageCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entrada de Mercadoria</h1>
            <p className="text-sm text-gray-500">Confirme chegadas físicas e atualize o estoque</p>
          </div>
        </div>
        <button
          onClick={() => { setShowDireta(true); setFormDireta({ produtoId: '', quantidade: '', cor: '', observacao: '' }); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow transition"
        >
          <LucidePlus className="w-4 h-4" /> Nova Entrada
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setAba('pendentes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${aba === 'pendentes' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <LucideClock className="w-4 h-4" />
          Aguardando Chegada
          {pendentesAtivos.length > 0 && (
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendentesAtivos.length}</span>
          )}
        </button>
        <button
          onClick={() => setAba('historico')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${aba === 'historico' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <LucideHistory className="w-4 h-4" />
          Histórico de Entradas
          <span className="bg-gray-300 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{historico.length}</span>
        </button>
      </div>

      {/* ── ABA PENDENTES ─────────────────────────────────────── */}
      {aba === 'pendentes' && (
        <div className="space-y-4">
          {pendentesAtivos.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <LucideClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Nenhum pedido aguardando chegada</p>
              <p className="text-sm text-gray-400 mt-1">Pedidos registrados pelo Compras aparecerão aqui.</p>
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
                      <span className="text-gray-400 text-xs">Data do pedido</span>
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

      {/* ── ABA HISTÓRICO ─────────────────────────────────────── */}
      {aba === 'historico' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {historico.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <LucideHistory className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma entrada realizada ainda</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-center">Pedido</th>
                  <th className="p-3 text-center">Recebido</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-left">Observação</th>
                  <th className="p-3 text-left">Realizado por</th>
                  <th className="p-3 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {historico.map(r => {
                  const isDivergencia = r.status === 'DIVERGENCIA';
                  return (
                    <tr key={r.id} className={`border-t hover:bg-gray-50 ${isDivergencia ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3">
                        <p className="font-medium text-gray-800">{r.produtoNome}</p>
                        <p className="text-xs text-gray-400">{r.produtoCodigo}</p>
                        {r.entradaDireta && <span className="text-xs text-indigo-500 font-medium">Entrada direta</span>}
                      </td>
                      <td className="p-3 text-center text-gray-500">{r.quantidadePedida ?? '—'}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-sm ${isDivergencia ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          +{r.quantidadeRecebida}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isDivergencia
                          ? <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200">
                              <LucideAlertTriangle className="w-3 h-3" /> Divergência
                            </span>
                          : <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                              <LucideCheckCircle className="w-3 h-3" /> Recebido
                            </span>}
                      </td>
                      <td className="p-3 text-gray-500 max-w-[180px] truncate">{r.observacaoEntrada || <span className="text-gray-300">—</span>}</td>
                      <td className="p-3 text-gray-600 text-xs">{r.realizadaPor}</td>
                      <td className="p-3 text-gray-400 text-xs whitespace-nowrap">{new Date(r.realizadaEm || r.criadoEm).toLocaleString('pt-BR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODAL CONFIRMAR CHEGADA ───────────────────────────── */}
      {modalPedido && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucidePackageCheck className="w-5 h-5 text-emerald-600" />
                Confirmar Chegada
              </h2>
              <button onClick={() => setModalPedido(null)} className="text-gray-400 hover:text-gray-600"><LucideX className="w-5 h-5" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <p className="font-semibold text-gray-700">{modalPedido.produtoNome}</p>
              <p className="text-gray-400 text-xs mt-0.5">
                {modalPedido.produtoCodigo} · Pedido: <strong className="text-orange-600">{modalPedido.quantidadePedida} unid.</strong> por {modalPedido.autor}
              </p>
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
                {formConfirmar.quantidade && Number(formConfirmar.quantidade) !== modalPedido.quantidadePedida && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <LucideAlertTriangle className="w-3 h-3" />
                    Divergência detectada (pedido: {modalPedido.quantidadePedida}). Será notificado Admin e Compras.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Data *</label>
                  <input
                    required type="date"
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300"
                    value={formConfirmar.data}
                    onChange={e => setFormConfirmar(f => ({ ...f, data: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Hora *</label>
                  <input
                    required type="time"
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300"
                    value={formConfirmar.hora}
                    onChange={e => setFormConfirmar(f => ({ ...f, hora: e.target.value }))}
                  />
                </div>
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
                  placeholder="NF, estado do produto, divergência..."
                  value={formConfirmar.observacao}
                  onChange={e => setFormConfirmar(f => ({ ...f, observacao: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setModalPedido(null)}
                  className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow flex items-center gap-2">
                  <LucideCheck className="w-4 h-4" /> Confirmar e Atualizar Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA ENTRADA DIRETA ─────────────────────────── */}
      {showDireta && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucidePlus className="w-5 h-5 text-emerald-600" />
                Nova Entrada Direta
              </h2>
              <button onClick={() => setShowDireta(false)} className="text-gray-400 hover:text-gray-600"><LucideX className="w-5 h-5" /></button>
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
                <input required type="number" min="1"
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  value={formDireta.quantidade}
                  onChange={e => setFormDireta(f => ({ ...f, quantidade: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Cor (opcional)</label>
                <input
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300"
                  placeholder="ex: Amarelo, Azul..."
                  value={formDireta.cor}
                  onChange={e => setFormDireta(f => ({ ...f, cor: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Observação (opcional)</label>
                <textarea rows={2}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 resize-none"
                  placeholder="NF, informações da chegada..."
                  value={formDireta.observacao}
                  onChange={e => setFormDireta(f => ({ ...f, observacao: e.target.value }))} />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setShowDireta(false)}
                  className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow flex items-center gap-2">
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
