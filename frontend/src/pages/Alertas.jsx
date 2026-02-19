// Alertas de estoque
// COMPRAS: vê alertas e pode marcar como "Pedido" (cria registro em zkPendentes)
// ADMIN/EXPEDICAO/SUPERVISAO: veem os alertas normalmente
import React, { useState, useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import { LucideX, LucideShoppingBag, LucideCheck } from 'lucide-react';

const PENDENTES_KEY = 'zkPendentes';
function loadPendentes() {
  try { return JSON.parse(localStorage.getItem(PENDENTES_KEY) || '[]'); } catch { return []; }
}
function savePendentes(lista) { localStorage.setItem(PENDENTES_KEY, JSON.stringify(lista)); }

export default function Alertas() {
  const { alertas, editarProduto } = useEstoque();
  const { user, can } = useAuth();

  const [pendentes, setPendentes] = useState(loadPendentes);
  const [modalPedido, setModalPedido] = useState(null);
  const [formPedido, setFormPedido] = useState({ quantidade: '', observacao: '' });
  const [sucesso, setSucesso] = useState('');

  const isCompras = user?.perfil === 'COMPRAS';

  const pendentesIds = useMemo(
    () => new Set(pendentes.filter(p => p.status === 'PENDENTE').map(p => p.produtoId)),
    [pendentes]
  );

  function abrirModalPedido(produto) {
    setFormPedido({ quantidade: String(Math.max(1, produto.estoqueMinimo - produto.estoqueAtual)), observacao: '' });
    setModalPedido(produto);
  }

  function salvarPedido(e) {
    e.preventDefault();
    const qtd = Number(formPedido.quantidade);
    if (!qtd || qtd < 1) return;
    const novo = {
      id: Date.now(),
      produtoId: modalPedido.id,
      produtoNome: modalPedido.nome,
      produtoCodigo: modalPedido.codigo,
      produtoCategoria: modalPedido.categoria,
      quantidadePedida: qtd,
      observacaoPedido: formPedido.observacao,
      autor: user.nome,
      autorPerfil: user.perfil,
      criadoEm: new Date().toISOString(),
      status: 'PENDENTE',
    };
    const nova = [novo, ...pendentes];
    setPendentes(nova);
    savePendentes(nova);
    setSucesso(`Pedido de "${modalPedido.nome}" registrado!`);
    setTimeout(() => setSucesso(''), 3500);
    setModalPedido(null);
  }

  function desativarAlerta(produto) {
    if (window.confirm(`Desativar alertas para "${produto.nome}"?`)) {
      editarProduto(produto.id, { ...produto, geraAlerta: false }, user);
    }
  }

  return (
    <div className="p-8">
      {sucesso && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold flex items-center gap-2">
          <LucideCheck className="w-4 h-4" /> {sucesso}
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alertas de Estoque</h1>
        {alertas.length > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {isCompras && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700 flex items-start gap-2">
          <LucideShoppingBag className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Clique em <strong>Marcar como Pedido</strong> para avisar a Expedição que o material já foi providenciado e está a caminho.</span>
        </div>
      )}

      {alertas.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-green-700 font-semibold text-lg">Nenhum alerta ativo</p>
          <p className="text-green-500 text-sm mt-1">Todos os produtos estão acima do estoque mínimo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {alertas.map(p => {
            const diferenca = p.estoqueMinimo - p.estoqueAtual;
            const jaPedido = pendentesIds.has(p.id);
            return (
              <div key={p.id} className={`bg-white border-2 rounded-xl p-5 shadow-sm ${jaPedido ? 'border-emerald-300' : 'border-red-300'}`}>
                <div className="flex items-start gap-4">
                  {p.imagem
                    ? <img src={p.imagem} alt={p.nome} className="w-16 h-16 object-contain rounded-lg border flex-shrink-0" />
                    : <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Sem img</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 flex-wrap">
                      <h3 className="font-bold text-gray-800 leading-snug">{p.nome}</h3>
                      {jaPedido && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap flex-shrink-0">
                          ✓ Pedido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{p.codigo} · {p.categoria}</p>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-red-600 text-xl">{p.estoqueAtual}</div>
                        <div className="text-xs text-gray-400">atual</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-500 text-xl">{p.estoqueMinimo}</div>
                        <div className="text-xs text-gray-400">mínimo</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-500 text-xl">{diferenca}</div>
                        <div className="text-xs text-gray-400">faltam</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (p.estoqueAtual / p.estoqueMinimo) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {Math.round((p.estoqueAtual / p.estoqueMinimo) * 100)}% do mínimo
                  </p>
                </div>
                {isCompras && (
                  <div className="mt-3">
                    {jaPedido ? (
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <LucideCheck className="w-3 h-3" /> Pedido registrado — aguardando Expedição
                      </p>
                    ) : (
                      <button
                        onClick={() => abrirModalPedido(p)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition shadow"
                      >
                        <LucideShoppingBag className="w-4 h-4" />
                        Marcar como Pedido
                      </button>
                    )}
                  </div>
                )}
                {can.editarProdutos && !isCompras && (
                  <button
                    onClick={() => desativarAlerta(p)}
                    className="mt-3 text-xs text-gray-400 hover:text-red-500 underline"
                  >
                    Desativar alerta para este produto
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Marcar como Pedido */}
      {modalPedido && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucideShoppingBag className="w-5 h-5 text-indigo-600" />
                Marcar como Pedido
              </h2>
              <button onClick={() => setModalPedido(null)} className="text-gray-400 hover:text-gray-600">
                <LucideX className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-700 text-sm">{modalPedido.nome}</p>
              <p className="text-xs text-gray-400">{modalPedido.codigo} · Estoque: {modalPedido.estoqueAtual} · Mínimo: {modalPedido.estoqueMinimo}</p>
            </div>
            <form onSubmit={salvarPedido} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Quantidade Pedida *</label>
                <input
                  required type="number" min="1"
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300"
                  value={formPedido.quantidade}
                  onChange={e => setFormPedido(f => ({ ...f, quantidade: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">Sugerido: {Math.max(1, modalPedido.estoqueMinimo - modalPedido.estoqueAtual)} unidades para atingir o mínimo</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Observação (opcional)</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 resize-none"
                  placeholder="Fornecedor, urgência, especificações..."
                  value={formPedido.observacao}
                  onChange={e => setFormPedido(f => ({ ...f, observacao: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setModalPedido(null)} className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow flex items-center gap-2">
                  <LucideShoppingBag className="w-4 h-4" /> Registrar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
