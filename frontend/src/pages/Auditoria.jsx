import React, { useState } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';

export default function Auditoria() {
  const { auditoria } = useEstoque();
  const { can } = useAuth();

  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [expandido, setExpandido] = useState(null);

  if (!can.verAuditoria) {
    return (
      <div className="p-8 text-red-500 text-center">
        <p className="text-xl font-semibold">Acesso restrito</p>
        <p>Você não tem permissão para visualizar a auditoria.</p>
      </div>
    );
  }

  const acoes = [...new Set(auditoria.map(a => a.acao))];

  const lista = auditoria
    .filter(a =>
      (!busca || a.usuario.toLowerCase().includes(busca.toLowerCase()) || a.entidade.toLowerCase().includes(busca.toLowerCase())) &&
      (!filtroAcao || a.acao === filtroAcao)
    )
    .slice()
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  function formatJSON(str) {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  }

  const corAcao = {
    CRIAR: 'bg-green-100 text-green-700',
    EDITAR: 'bg-blue-100 text-blue-700',
    EXCLUIR: 'bg-red-100 text-red-700',
    MOVIMENTACAO: 'bg-purple-100 text-purple-700',
    LOGIN: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Auditoria</h1>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-56"
          placeholder="Buscar por usuário ou entidade..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filtroAcao}
          onChange={e => setFiltroAcao(e.target.value)}
        >
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
            {lista.length === 0 && (
              <tr><td colSpan={6} className="text-center p-8 text-gray-400">Nenhum registro encontrado.</td></tr>
            )}
            {lista.map(a => (
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
                  <td className="p-3 text-gray-400">{new Date(a.criadoEm).toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-center">
                    {(a.antes || a.depois) && (
                      <button
                        onClick={() => setExpandido(expandido === a.id ? null : a.id)}
                        className="text-blue-500 hover:underline text-xs"
                      >
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
      <p className="text-xs text-gray-400 mt-2">{lista.length} registro(s)</p>
    </div>
  );
}
