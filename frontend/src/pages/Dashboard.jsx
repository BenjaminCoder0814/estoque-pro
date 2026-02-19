import React, { useMemo, useState } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { LucideBell, LucideX } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const COMPRAS_KEY    = 'zkCompras';
const NOTIF_KEY      = 'zkNotificacoes';

const CARD_STYLES = {
  blue:   'bg-blue-50   border-blue-200   text-blue-800',
  red:    'bg-red-50    border-red-200     text-red-800',
  green:  'bg-green-50  border-green-200   text-green-800',
  yellow: 'bg-yellow-50 border-yellow-200  text-yellow-800',
  purple: 'bg-purple-50 border-purple-200  text-purple-800',
  orange: 'bg-orange-50 border-orange-200  text-orange-800',
  cyan:   'bg-cyan-50   border-cyan-200    text-cyan-800',
};

function Card({ title, value, sub, color = 'blue' }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-1 shadow-sm ${CARD_STYLES[color]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</div>
      <div className="text-3xl font-bold truncate">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
    </div>
  );
}

function chartOpts(title) {
  return {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: !!title, text: title, font: { size: 13 } } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
}

function loadCompras() {
  try { return JSON.parse(localStorage.getItem(COMPRAS_KEY) || '[]'); } catch { return []; }
}
function loadNotificacoes() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
}
function saveNotificacoes(lista) { localStorage.setItem(NOTIF_KEY, JSON.stringify(lista)); }

export default function Dashboard() {
  const { produtos, movimentacoes, alertas } = useEstoque();
  const { user } = useAuth();

  const [notificacoes, setNotificacoes] = useState(loadNotificacoes);
  const [mostrarNotif, setMostrarNotif] = useState(false);

  // ── Compras / Divergências ──────────────────────────────────────────────
  const compras = useMemo(loadCompras, []);
  const comprasPendentes = useMemo(() => compras.filter(c => c.status === 'PENDENTE').length, [compras]);
  const divergencias     = useMemo(() => compras.filter(c => c.status === 'DIVERGENCIA').length, [compras]);

  // ── Notificações não lidas ─────────────────────────────────────────────
  const naoLidas = useMemo(
    () => notificacoes.filter(n => !n.lida),
    [notificacoes]
  );

  function marcarLida(id) {
    const nova = notificacoes.map(n => n.id === id ? { ...n, lida: true } : n);
    setNotificacoes(nova);
    saveNotificacoes(nova);
  }

  function marcarTodasLidas() {
    const nova = notificacoes.map(n => ({ ...n, lida: true }));
    setNotificacoes(nova);
    saveNotificacoes(nova);
  }

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  // ── Cards ──────────────────────────────────────────────────────────────
  const totalProdutos = useMemo(() => produtos.filter(p => p.ativo).length, [produtos]);

  const estoqueTotal = useMemo(
    () => produtos.filter(p => p.controlaEstoque && p.ativo).reduce((s, p) => s + p.estoqueAtual, 0),
    [produtos]
  );

  const saidasMesTotal = useMemo(
    () => movimentacoes
      .filter(m => {
        const d = new Date(m.criadoEm);
        return m.tipo === 'SAIDA' && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      })
      .reduce((s, m) => s + m.quantidade, 0),
    [movimentacoes, mesAtual, anoAtual]
  );

  const { maisSaido, menosSaido } = useMemo(() => {
    const map = {};
    movimentacoes.filter(m => m.tipo === 'SAIDA').forEach(m => {
      map[m.produtoNome] = (map[m.produtoNome] || 0) + m.quantidade;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return {
      maisSaido: sorted[0]?.[0] ?? '—',
      menosSaido: sorted[sorted.length - 1]?.[0] ?? '—',
    };
  }, [movimentacoes]);

  // ── Gráfico 1: Saídas por mês (últimos 6 meses) ────────────────────────
  const dadosUlt6Meses = useMemo(() => {
    const labels = [];
    const valores = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual - i, 1);
      const m = d.getMonth();
      const a = d.getFullYear();
      labels.push(d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }));
      valores.push(
        movimentacoes.filter(mv => {
          const dm = new Date(mv.criadoEm);
          return mv.tipo === 'SAIDA' && dm.getMonth() === m && dm.getFullYear() === a;
        }).reduce((s, mv) => s + mv.quantidade, 0)
      );
    }
    return {
      labels,
      datasets: [{ label: 'Saídas', data: valores, backgroundColor: '#3b82f6', borderRadius: 6 }],
    };
  }, [movimentacoes, mesAtual, anoAtual]);

  // ── Gráfico 2: Ranking top 7 produtos por saídas ───────────────────────
  const dadosRanking = useMemo(() => {
    const map = {};
    movimentacoes.filter(m => m.tipo === 'SAIDA').forEach(m => {
      map[m.produtoNome] = (map[m.produtoNome] || 0) + m.quantidade;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([n]) => n.length > 18 ? n.slice(0, 16) + '…' : n),
      datasets: [{ label: 'Total Saídas', data: sorted.map(([, v]) => v), backgroundColor: '#8b5cf6', borderRadius: 6 }],
    };
  }, [movimentacoes]);

  // ── Gráfico 3: Entrada x Saída do mês ──────────────────────────────────
  const dadosEntradaSaida = useMemo(() => {
    const movMes = movimentacoes.filter(m => {
      const d = new Date(m.criadoEm);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    const entradas = movMes.filter(m => m.tipo === 'ENTRADA').reduce((s, m) => s + m.quantidade, 0);
    const saidas = movMes.filter(m => m.tipo === 'SAIDA').reduce((s, m) => s + m.quantidade, 0);
    return {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        data: [entradas, saidas],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
      }],
    };
  }, [movimentacoes, mesAtual, anoAtual]);

  // ── Últimas movimentações ──────────────────────────────────────────────
  const ultimas = useMemo(
    () => [...movimentacoes].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 10),
    [movimentacoes]
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={() => setMostrarNotif(v => !v)}
          className="relative flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:shadow-md transition shadow-sm"
        >
          <LucideBell className="w-4 h-4" />
          Notificações
          {naoLidas.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {naoLidas.length > 9 ? '9+' : naoLidas.length}
            </span>
          )}
        </button>
      </div>

      {/* Painel de Notificações */}
      {mostrarNotif && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <LucideBell className="w-4 h-4 text-blue-500" />
              Notificações {naoLidas.length > 0 && <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-bold">{naoLidas.length} nova{naoLidas.length !== 1 ? 's' : ''}</span>}
            </h2>
            <div className="flex items-center gap-3">
              {naoLidas.length > 0 && (
                <button onClick={marcarTodasLidas} className="text-xs text-blue-600 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
              <button onClick={() => setMostrarNotif(false)} className="text-gray-400 hover:text-gray-600">
                <LucideX className="w-4 h-4" />
              </button>
            </div>
          </div>
          {notificacoes.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Nenhuma notificação.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {[...notificacoes].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border transition ${n.lida ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{n.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(n.criadoEm).toLocaleString('pt-BR')}</p>
                  </div>
                  {!n.lida && (
                    <button onClick={() => marcarLida(n.id)} className="text-xs text-blue-600 hover:underline flex-shrink-0 mt-0.5">
                      Lida
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Total Produtos" value={totalProdutos.toLocaleString()} sub="produtos ativos" color="blue" />
        <Card title="Estoque Total" value={estoqueTotal.toLocaleString()} sub="unidades (ativos)" color="cyan" />
        <Card title="Alertas Ativos" value={alertas.length} sub="estoque abaixo do mínimo" color={alertas.length > 0 ? 'red' : 'green'} />
        <Card title="Saídas do Mês" value={saidasMesTotal.toLocaleString()} sub="unidades expedidas" color="yellow" />
        <Card title="Compras Pendentes" value={comprasPendentes.toLocaleString()} sub="pedidos aguardando" color={comprasPendentes > 0 ? 'orange' : 'green'} />
        <Card title="Divergências" value={divergencias.toLocaleString()} sub="pedidos com divergência" color={divergencias > 0 ? 'red' : 'green'} />
        <Card title="Mais Saído" value={maisSaido} sub="produto com mais saídas" color="purple" />
        <Card title="Menos Saído" value={menosSaido} sub="produto com menos saídas" color="blue" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Saídas por Mês (últimos 6 meses)</h2>
          <Bar data={dadosUlt6Meses} options={chartOpts()} height={120} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Entrada × Saída — Mês Atual</h2>
          <div className="w-48 h-48">
            <Doughnut data={dadosEntradaSaida} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Ranking de Produtos (total saídas)</h2>
        {dadosRanking.labels.length === 0
          ? <p className="text-gray-400 text-sm text-center py-6">Nenhuma saída registrada ainda.</p>
          : <Bar data={dadosRanking} options={chartOpts()} height={80} />}
      </div>

      {/* Alerta crítico — abaixo dos gráficos */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-wrap gap-2 items-center">
          <span className="text-red-700 font-semibold">⚠️ {alertas.length} produto(s) com estoque crítico:</span>
          {alertas.map(p => (
            <span key={p.id} className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full border border-red-200">
              {p.nome} ({p.estoqueAtual}/{p.estoqueMinimo})
            </span>
          ))}
        </div>
      )}

      {/* Últimas movimentações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Últimas 10 Movimentações</h2>
        {ultimas.length === 0
          ? <p className="text-gray-400 text-sm text-center py-6">Nenhuma movimentação registrada.</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b text-left">
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Produto</th>
                  <th className="pb-2 text-center">Qtd</th>
                  <th className="pb-2">Usuário</th>
                  <th className="pb-2">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {ultimas.map(m => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-2 font-medium">{m.produtoNome}</td>
                    <td className="py-2 text-center">{m.quantidade}</td>
                    <td className="py-2 text-gray-500">{m.usuario}</td>
                    <td className="py-2 text-gray-400">{new Date(m.criadoEm).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

