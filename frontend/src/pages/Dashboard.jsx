// Dashboard — visão geral do estoque para o ADMIN
// Cards: total de itens, abaixo do mínimo, última movimentação, produto crítico
// Tabelas: Top 5 produtos com menor estoque | Últimas 5 movimentações
import React, { useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LucidePackage, LucideAlertTriangle, LucideArrowDownToLine,
  LucideArrowUpFromLine, LucideActivity, LucideTrendingDown,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
    red:    'bg-red-50    border-red-200     text-red-700',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200  text-orange-700',
    purple: 'bg-purple-50 border-purple-200  text-purple-700',
  };
  return (
    <div className={`rounded-2xl border-2 p-6 flex items-start gap-4 shadow-sm ${colors[color] || colors.blue}`}>
      <div className="p-3 rounded-xl bg-white/60">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-3xl font-black leading-tight mt-1 truncate">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { produtos, movimentacoes, alertas } = useEstoque();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Stats ──────────────────────────────────────────────────────────────
  const ativos = useMemo(() => produtos.filter(p => p.ativo), [produtos]);
  const totalUnidades = useMemo(() =>
    ativos.filter(p => p.controlaEstoque).reduce((s, p) => s + (p.estoqueAtual || 0), 0),
    [ativos]
  );
  const abaixoMinimo = useMemo(() =>
    ativos.filter(p => p.controlaEstoque && p.geraAlerta && p.estoqueAtual <= p.estoqueMinimo).length,
    [ativos]
  );

  const ultimaMov = useMemo(() =>
    movimentacoes.length ? movimentacoes.reduce((a, b) =>
      new Date(a.criadoEm) > new Date(b.criadoEm) ? a : b
    ) : null,
    [movimentacoes]
  );

  const produtoCritico = useMemo(() => {
    const comControle = ativos.filter(p => p.controlaEstoque && p.estoqueMinimo > 0);
    if (!comControle.length) return null;
    return comControle.reduce((a, b) =>
      (a.estoqueAtual / (a.estoqueMinimo || 1)) < (b.estoqueAtual / (b.estoqueMinimo || 1)) ? a : b
    );
  }, [ativos]);

  // ── Top 5 críticos ─────────────────────────────────────────────────────
  const top5Criticos = useMemo(() =>
    [...ativos]
      .filter(p => p.controlaEstoque)
      .sort((a, b) => {
        const rA = a.estoqueAtual / (a.estoqueMinimo || 1);
        const rB = b.estoqueAtual / (b.estoqueMinimo || 1);
        return rA - rB;
      })
      .slice(0, 5),
    [ativos]
  );

  // ── Últimas 5 movimentações ─────────────────────────────────────────────
  const ultimas5 = useMemo(() =>
    [...movimentacoes]
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
      .slice(0, 5),
    [movimentacoes]
  );

  // ── Entradas do dia ────────────────────────────────────────────────────
  const hoje = new Date().toDateString();
  const entradasHoje = useMemo(() =>
    movimentacoes.filter(m => m.tipo === 'ENTRADA' && new Date(m.criadoEm).toDateString() === hoje).length,
    [movimentacoes]
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bem-vindo, <span className="font-semibold text-gray-700">{user?.nome}</span> · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={LucidePackage}
          label="Total em Estoque"
          value={totalUnidades.toLocaleString('pt-BR')}
          sub={`${ativos.filter(p => p.controlaEstoque).length} SKUs controlados`}
          color="blue"
        />
        <StatCard
          icon={LucideAlertTriangle}
          label="Abaixo do Mínimo"
          value={abaixoMinimo}
          sub={abaixoMinimo > 0 ? 'Requer atenção imediata' : 'Tudo dentro do limite'}
          color={abaixoMinimo > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={LucideArrowDownToLine}
          label="Entradas Hoje"
          value={entradasHoje}
          sub={ultimaMov ? `Última: ${fmt(ultimaMov.criadoEm)}` : 'Nenhuma movimentação ainda'}
          color="green"
        />
        <StatCard
          icon={LucideTrendingDown}
          label="Produto Crítico"
          value={produtoCritico ? produtoCritico.estoqueAtual : '—'}
          sub={produtoCritico ? produtoCritico.nome : 'Nenhum produto crítico'}
          color="orange"
        />
      </div>

      {/* Alerta rápido */}
      {abaixoMinimo > 0 && (
        <div
          className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-4 cursor-pointer hover:bg-red-100 transition"
          onClick={() => navigate('/alertas')}
        >
          <LucideAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-semibold text-sm">
            {abaixoMinimo} produto{abaixoMinimo > 1 ? 's estão' : ' está'} abaixo do estoque mínimo. Clique para ver os alertas.
          </p>
        </div>
      )}

      {/* Tabelas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Produtos críticos */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <LucideTrendingDown className="w-4 h-4 text-orange-500" />
              5 Produtos com Menor Estoque
            </h2>
            <button
              onClick={() => navigate('/produtos')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium text-xs">Produto</th>
                  <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Atual</th>
                  <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Mínimo</th>
                  <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {top5Criticos.map(p => {
                  const abaixo = p.estoqueAtual <= p.estoqueMinimo;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs leading-tight">{p.nome}</p>
                        <p className="text-gray-400 text-xs">{p.codigo}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-sm ${abaixo ? 'text-red-600' : 'text-gray-700'}`}>
                          {p.estoqueAtual}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{p.estoqueMinimo}</td>
                      <td className="px-4 py-3 text-center">
                        {abaixo
                          ? <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">⚠ Alerta</span>
                          : <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full">OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
                {top5Criticos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      Nenhum produto cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimas movimentações */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <LucideActivity className="w-4 h-4 text-blue-500" />
              Últimas Movimentações
            </h2>
            <button
              onClick={() => navigate('/movimentacoes')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Ver histórico →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium text-xs">Produto</th>
                  <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Tipo</th>
                  <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Qtd</th>
                  <th className="px-4 py-2 text-left text-gray-500 font-medium text-xs">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ultimas5.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs leading-tight truncate max-w-[150px]">{m.produtoNome}</p>
                      <p className="text-gray-400 text-xs">{m.usuario}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.tipo === 'ENTRADA'
                        ? <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 justify-center">
                            <LucideArrowDownToLine className="w-3 h-3" /> IN
                          </span>
                        : <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 justify-center">
                            <LucideArrowUpFromLine className="w-3 h-3" /> OUT
                          </span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{m.quantidade}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(m.criadoEm)}</td>
                  </tr>
                ))}
                {ultimas5.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      Nenhuma movimentação registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

