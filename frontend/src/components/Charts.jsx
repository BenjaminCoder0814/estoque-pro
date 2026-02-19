import React from 'react';
export function Card({ title, value }) {
  return (
    <div className="bg-white rounded shadow p-4 text-center border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-black">{value}</div>
    </div>
  );
}
export function BarChart({ produtos }) {
  // Simples mock
  return (
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <div className="font-bold mb-2">Saídas por mês</div>
      <div className="h-32 flex items-end gap-2">
        {produtos.map(p => (
          <div key={p.id} className="bg-blue-300 w-8" style={{height: `${p.vendas}px`}} title={p.nome}></div>
        ))}
      </div>
    </div>
  );
}
export function PieChart({ produtos }) {
  // Simples mock
  return (
    <div className="bg-white rounded shadow p-4 border border-gray-100">
      <div className="font-bold mb-2">Ranking de Produtos</div>
      <div className="flex gap-2">
        {produtos.map(p => (
          <div key={p.id} className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">{p.vendas}</div>
            <div className="text-xs mt-1">{p.nome}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
