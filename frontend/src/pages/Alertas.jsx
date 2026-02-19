import React from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';

export default function Alertas() {
  const { alertas, editarProduto } = useEstoque();
  const { user, can } = useAuth();

  function desativarAlerta(produto) {
    if (window.confirm(`Desativar alertas para "${produto.nome}"?`)) {
      editarProduto(produto.id, { ...produto, geraAlerta: false }, user);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alertas de Estoque</h1>
        {alertas.length > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

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
            return (
              <div key={p.id} className="bg-white border-2 border-red-300 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {p.imagem
                    ? <img src={p.imagem} alt={p.nome} className="w-16 h-16 object-contain rounded-lg border" />
                    : <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">Sem img</div>}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{p.nome}</h3>
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
                {can.editarProdutos && (
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
    </div>
  );
}
