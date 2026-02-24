// Módulo PENDENTES — rastreamento de pedidos de reposição
// COMPRAS: cria pedidos nas Alertas, aqui apenas acompanha o status
// EXPEDICAO / ADMIN: visualiza tudo, acessa confirmação pela página Entrada
import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';
import {
  LucideClipboardList, LucideClock, LucideCheckCircle,
  LucideAlertTriangle, LucideSearch, LucidePackageCheck, LucideX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PENDENTES_KEY = 'zkPendentes';
function loadPendentes() {
  try { return JSON.parse(localStorage.getItem(PENDENTES_KEY) || '[]'); } catch { return []; }
}
function savePendentes(lista) { localStorage.setItem(PENDENTES_KEY, JSON.stringify(lista)); }

function ImgComFallback({ src, alt, className }) {
  const [erro, setErro] = useState(false);
  if (!src || erro) {
    return <div className="w-8 h-8 bg-gray-100 rounded border flex-shrink-0" />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setErro(true)} />;
}

const STATUS_CONFIG = {
  PENDENTE:    { label: 'Pendente',     bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: LucideClock },
  RECEBIDO:    { label: 'Recebido',     bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: LucideCheckCircle },
  DIVERGENCIA: { label: 'Divergência',  bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    icon: LucideAlertTriangle },
};

export default function Pendentes() {
  const { user, can } = useAuth();
  const { produtos } = useEstoque();
  const navigate = useNavigate();

  const [pendentes, setPendentes] = useState(loadPendentes);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');

  const isCompras = user?.perfil === 'COMPRAS';
  const podeConfirmar = can?.confirmarEntrada;

  // COMPRAS vê apenas os próprios pedidos
  const listaBase = useMemo(() => {
    return [...pendentes].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }, [pendentes]);

  const listaFiltrada = useMemo(() => {
    return listaBase.filter(p => {
      if (filtroStatus !== 'TODOS' && p.status !== filtroStatus) return false;
      if (busca) {
        const b = busca.toLowerCase();
        if (!p.produtoNome?.toLowerCase().includes(b) && !p.produtoCodigo?.toLowerCase().includes(b)) return false;
      }
      return true;
    });
  }, [listaBase, filtroStatus, busca]);

  const contadores = useMemo(() => ({
    TODOS:       listaBase.length,
    PENDENTE:    listaBase.filter(p => p.status === 'PENDENTE').length,
    RECEBIDO:    listaBase.filter(p => p.status === 'RECEBIDO').length,
    DIVERGENCIA: listaBase.filter(p => p.status === 'DIVERGENCIA').length,
  }), [listaBase]);

  function cancelarPedido(id) {
    if (!window.confirm('Cancelar este pedido pendente?')) return;
    const nova = pendentes.map(p => p.id === id ? { ...p, status: 'CANCELADO' } : p);
    setPendentes(nova);
    savePendentes(nova);
  }

  function getProduto(produtoId) {
    return produtos.find(p => p.id === produtoId);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
            <LucideClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos Pendentes</h1>
            <p className="text-sm text-gray-500">
              {isCompras ? 'Acompanhe os pedidos que você registrou' : 'Todos os pedidos de reposição do sistema'}
            </p>
          </div>
        </div>

        {/* Botão ir para Entrada (quem pode confirmar) */}
        {podeConfirmar && contadores.PENDENTE > 0 && (
          <button
            onClick={() => navigate('/entrada')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow transition"
          >
            <LucidePackageCheck className="w-4 h-4" />
            Confirmar Chegadas ({contadores.PENDENTE})
          </button>
        )}
      </div>

      {/* Info COMPRAS */}
      {isCompras && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700 flex items-start gap-2">
          <LucideClipboardList className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Para registrar um novo pedido, vá em <strong>Alertas</strong> e clique em <strong>Marcar como Pedido</strong>.
            A Expedição confirmará a chegada e o estoque será atualizado automaticamente.
          </span>
        </div>
      )}

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'TODOS', label: 'Todos' },
          { key: 'PENDENTE', label: 'Pendentes' },
          { key: 'RECEBIDO', label: 'Recebidos' },
          { key: 'DIVERGENCIA', label: 'Divergências' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroStatus(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition
              ${filtroStatus === f.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
          >
            {f.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold
              ${filtroStatus === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {contadores[f.key] ?? 0}
            </span>
          </button>
        ))}

        {/* Busca */}
        <div className="ml-auto flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <LucideSearch className="w-4 h-4 text-gray-400" />
          <input
            className="outline-none text-gray-700 placeholder-gray-400 w-44"
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-gray-400 hover:text-gray-600">
              <LucideX className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {listaFiltrada.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <LucideClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
          {isCompras && filtroStatus === 'TODOS' && (
            <p className="text-sm text-gray-400 mt-1">
              Vá para <strong>Alertas</strong> e clique em "Marcar como Pedido" para criar um pedido.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-center">Qtd Pedida</th>
                <th className="p-3 text-center">Qtd Recebida</th>
                <th className="p-3 text-left">Cor</th>
                <th className="p-3 text-left">Pedido por</th>
                <th className="p-3 text-left">Data do Pedido</th>
                <th className="p-3 text-center">Status</th>
                {isCompras && <th className="p-3 text-center">Ação</th>}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map(p => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDENTE;
                const Icon = cfg.icon;
                const produto = getProduto(p.produtoId);
                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <ImgComFallback
                          src={produto?.imagem}
                          alt={produto?.nome}
                          className="w-8 h-8 object-contain rounded border flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium text-gray-800 leading-tight">{p.produtoNome}</p>
                          <p className="text-xs text-gray-400">{p.produtoCodigo} · {p.produtoCategoria}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-orange-600 text-base">{p.quantidadePedida}</span>
                    </td>
                    <td className="p-3 text-center">
                      {p.quantidadeRecebida != null
                        ? <span className={`font-bold text-base ${p.status === 'DIVERGENCIA' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {p.quantidadeRecebida}
                          </span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {p.corRecebida || p.cor || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-3">
                      <p className="text-gray-700 text-xs font-medium">{p.autor}</p>
                      <p className="text-gray-400 text-xs">{p.autorPerfil}</p>
                    </td>
                    <td className="p-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                      {p.observacaoEntrada && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[160px] truncate" title={p.observacaoEntrada}>
                          💬 {p.observacaoEntrada}
                        </p>
                      )}
                    </td>
                    {isCompras && (
                      <td className="p-3 text-center">
                        {p.status === 'PENDENTE' && (
                          <button
                            onClick={() => cancelarPedido(p.id)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded-lg transition"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
