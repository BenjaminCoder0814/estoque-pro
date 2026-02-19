import React, { useState, useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';

function exportarCSV(dados, nome) {
  if (!dados.length) return;
  const cabecalho = Object.keys(dados[0]).join(';');
  const linhas = dados.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));
  const conteudo = [cabecalho, ...linhas].join('\n');
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const { movimentacoes, produtos } = useEstoque();
  const { can } = useAuth();
  const [aba, setAba] = useState('movimentacoes');

  const saidasPorDia = useMemo(() => {
    const map = {};
    movimentacoes.filter(m => m.tipo === 'SAIDA').forEach(m => {
      const dia = m.criadoEm.slice(0, 10);
      map[dia] = (map[dia] || 0) + m.quantidade;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30).map(([dia, qty]) => ({ Dia: dia, 'Saídas (unid.)': qty }));
  }, [movimentacoes]);

  const saidasPorMes = useMemo(() => {
    const map = {};
    movimentacoes.filter(m => m.tipo === 'SAIDA').forEach(m => {
      const mes = m.criadoEm.slice(0, 7);
      map[mes] = (map[mes] || 0) + m.quantidade;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([mes, qty]) => ({ Mês: mes, 'Saídas (unid.)': qty }));
  }, [movimentacoes]);

  const rankingProdutos = useMemo(() => {
    const map = {};
    movimentacoes.filter(m => m.tipo === 'SAIDA').forEach(m => {
      map[m.produtoNome] = (map[m.produtoNome] || 0) + m.quantidade;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([produto, qty], i) => ({ '#': i + 1, Produto: produto, 'Total Saídas': qty }));
  }, [movimentacoes]);

  const porUsuario = useMemo(() => {
    const map = {};
    movimentacoes.forEach(m => {
      const key = m.usuario;
      if (!map[key]) map[key] = { Usuário: m.usuario, Perfil: m.usuarioPerfil, Entradas: 0, Saídas: 0 };
      if (m.tipo === 'ENTRADA') map[key].Entradas += m.quantidade;
      else map[key].Saídas += m.quantidade;
    });
    return Object.values(map).sort((a, b) => (b.Entradas + b.Saídas) - (a.Entradas + a.Saídas));
  }, [movimentacoes]);

  const movimentacoesCompletas = useMemo(() => {
    return movimentacoes
      .slice()
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
      .map(m => ({
        Tipo: m.tipo,
        Produto: m.produtoNome,
        Quantidade: m.quantidade,
        'Est. Antes': m.estoqueAntes,
        'Est. Depois': m.estoqueDepois,
        Usuário: m.usuario,
        Perfil: m.usuarioPerfil,
        Observação: m.observacao || '',
        'Data/Hora': new Date(m.criadoEm).toLocaleString('pt-BR'),
      }));
  }, [movimentacoes]);

  if (!can.verRelatorios) {
    return (
      <div className="p-8 text-red-500 text-center">
        <p className="text-xl font-semibold">Acesso restrito</p>
        <p>Você não tem permissão para visualizar relatórios.</p>
      </div>
    );
  }

  const abas = [
    { id: 'movimentacoes', label: 'Todas as Movimentações' },
    { id: 'saidasDia', label: 'Saídas por Dia' },
    { id: 'saidasMes', label: 'Saídas por Mês' },
    { id: 'ranking', label: 'Ranking de Produtos' },
    { id: 'usuarios', label: 'Por Usuário' },
  ];

  const dados = { movimentacoes: movimentacoesCompletas, saidasDia: saidasPorDia, saidasMes: saidasPorMes, ranking: rankingProdutos, usuarios: porUsuario };
  const nomes = { movimentacoes: 'movimentacoes.csv', saidasDia: 'saidas_por_dia.csv', saidasMes: 'saidas_por_mes.csv', ranking: 'ranking_produtos.csv', usuarios: 'por_usuario.csv' };
  const tabela = dados[aba] || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <button
          onClick={() => exportarCSV(tabela, nomes[aba])}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {abas.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aba === a.id ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        {tabela.length === 0 ? (
          <p className="text-center p-8 text-gray-400">Nenhum dado disponível.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                {Object.keys(tabela[0]).map(col => <th key={col} className="p-3 text-left">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {tabela.map((row, i) => (
                <tr key={i} className="border-t text-sm hover:bg-gray-50 transition">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="p-3 text-gray-700">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">{tabela.length} registro(s)</p>
    </div>
  );
}
