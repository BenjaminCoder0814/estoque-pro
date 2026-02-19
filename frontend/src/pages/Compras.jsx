// Página de Compras — Pedidos, Recebimento e Integração com Expedição
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEstoque } from '../contexts/EstoqueContext';
import {
  LucideShoppingCart, LucidePlus, LucidePackageCheck, LucideAlertCircle,
  LucideCheckCircle2, LucideClock, LucideX, LucideChevronDown, LucideChevronUp,
  LucideTruck, LucideAlertTriangle,
} from 'lucide-react';

// ── localStorage keys ──────────────────────
const COMPRAS_KEY  = 'zkCompras';
const NOTIF_KEY    = 'zkNotificacoes';

function loadCompras() {
  try { return JSON.parse(localStorage.getItem(COMPRAS_KEY) || '[]'); } catch { return []; }
}
function saveCompras(lista) { localStorage.setItem(COMPRAS_KEY, JSON.stringify(lista)); }
function loadNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
}
function saveNotifs(lista) { localStorage.setItem(NOTIF_KEY, JSON.stringify(lista)); }

// ── Helpers ────────────────────────────────
const CATEGORIAS = ['Cadeados', 'Abraçadeiras', 'Arames', 'Fitas', 'Lacres', 'Sacos', 'Outros'];
const STATUS_LABEL = {
  PENDENTE:    { label: 'Pendente',        color: 'bg-amber-100 text-amber-700 border-amber-300' },
  RECEBIDO:    { label: 'Recebido',        color: 'bg-green-100 text-green-700 border-green-300' },
  DIVERGENCIA: { label: 'Com Divergência', color: 'bg-red-100   text-red-700   border-red-300'   },
};

const VAZIO_PEDIDO = {
  produto: '', modelo: '', cor: '', categoria: '', quantidade: '',
  fornecedor: '', previsaoEntrega: '', observacao: '',
};
const VAZIO_RECEBIMENTO = {
  quantidadeRecebida: '', notaFiscal: '', fornecedorReal: '',
  dataRecebimento: new Date().toISOString().slice(0, 10),
  horaRecebimento: new Date().toTimeString().slice(0, 5),
  observacaoRecebimento: '',
  produtoDivergente: '', modeloDivergente: '', corDivergente: '', quantidadeDivergente: '',
};

export default function Compras() {
  const { user, can } = useAuth();
  const { criarProduto, editarProduto, produtos } = useEstoque();

  const [compras, setCompras]                 = useState(loadCompras);
  const [showForm, setShowForm]               = useState(false);
  const [form, setForm]                       = useState(VAZIO_PEDIDO);
  const [filtroStatus, setFiltroStatus]       = useState('');
  const [expandido, setExpandido]             = useState(null);
  // Modal de recebimento (expedição)
  const [recebendo, setRecebendo]             = useState(null);   // id do pedido
  const [recForm, setRecForm]                 = useState(VAZIO_RECEBIMENTO);
  const [hasDivergencia, setHasDivergencia]   = useState(false);
  const [notifs, setNotifs]                   = useState(loadNotifs);
  const [toast, setToast]                     = useState(null);

  // Atualiza quando localStorage muda (outra aba)
  useEffect(() => {
    const handler = () => {
      setCompras(loadCompras());
      setNotifs(loadNotifs());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Toast helper
  function mostrarToast(msg, tipo = 'success') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Salvar novo pedido ─────────────────────
  function salvarPedido(e) {
    e.preventDefault();
    if (!form.produto || !form.quantidade || !form.fornecedor) return;
    const novo = {
      id: Date.now(),
      ...form,
      quantidade: Number(form.quantidade),
      status: 'PENDENTE',
      criadoPor: user.nome,
      criadoPorPerfil: user.perfil,
      criadoEm: new Date().toISOString(),
      recebimento: null,
    };
    const nova = [novo, ...compras];
    setCompras(nova);
    saveCompras(nova);
    setForm(VAZIO_PEDIDO);
    setShowForm(false);
    mostrarToast('Pedido de compra registrado com sucesso!');
  }

  // ── Abrir modal de recebimento ─────────────
  function abrirRecebimento(id) {
    setRecebendo(id);
    setHasDivergencia(false);
    setRecForm({
      ...VAZIO_RECEBIMENTO,
      dataRecebimento: new Date().toISOString().slice(0, 10),
      horaRecebimento: new Date().toTimeString().slice(0, 5),
    });
  }

  // ── Confirmar recebimento ──────────────────
  function confirmarRecebimento(e) {
    e.preventDefault();
    const pedido = compras.find(c => c.id === recebendo);
    if (!pedido) return;

    const agora = new Date().toISOString();

    if (!hasDivergencia) {
      // Recebimento conforme — sobe produto automaticamente
      const prodExistente = produtos.find(p =>
        p.nome.toLowerCase() === pedido.produto.toLowerCase() && p.ativo
      );
      if (prodExistente) {
        editarProduto(prodExistente.id, {
          estoqueAtual: prodExistente.estoqueAtual + pedido.quantidade,
        }, user);
        mostrarToast(`Estoque de "${prodExistente.nome}" atualizado automaticamente! +${pedido.quantidade} unidades.`);
      } else {
        criarProduto({
          nome: pedido.produto,
          codigo: `IMP-${Date.now()}`,
          categoria: pedido.categoria || 'Outros',
          estoqueAtual: pedido.quantidade,
          estoqueMinimo: 5,
          controlaEstoque: true,
          geraAlerta: true,
          ativo: true,
          imagem: '',
          modelo: pedido.modelo,
          cor: pedido.cor,
        }, user);
        mostrarToast(`Produto "${pedido.produto}" adicionado ao estoque automaticamente!`);
      }

      const recebimentoInfo = {
        tipo: 'CONFORME',
        quantidadeRecebida: pedido.quantidade,
        notaFiscal: recForm.notaFiscal,
        fornecedorReal: recForm.fornecedorReal || pedido.fornecedor,
        dataRecebimento: recForm.dataRecebimento,
        horaRecebimento: recForm.horaRecebimento,
        observacao: recForm.observacaoRecebimento,
        recebidoPor: user.nome,
        recebidoPorPerfil: user.perfil,
        recebidoEm: agora,
      };
      const nova = compras.map(c => c.id === recebendo
        ? { ...c, status: 'RECEBIDO', recebimento: recebimentoInfo }
        : c
      );
      setCompras(nova);
      saveCompras(nova);
    } else {
      // Recebimento com divergência
      const divergenciaInfo = {
        tipo: 'DIVERGENCIA',
        quantidadeRecebida: Number(recForm.quantidadeDivergente) || pedido.quantidade,
        notaFiscal: recForm.notaFiscal,
        fornecedorReal: recForm.fornecedorReal || pedido.fornecedor,
        dataRecebimento: recForm.dataRecebimento,
        horaRecebimento: recForm.horaRecebimento,
        observacao: recForm.observacaoRecebimento,
        produtoDivergente: recForm.produtoDivergente,
        modeloDivergente: recForm.modeloDivergente,
        corDivergente: recForm.corDivergente,
        recebidoPor: user.nome,
        recebidoPorPerfil: user.perfil,
        recebidoEm: agora,
      };
      const nova = compras.map(c => c.id === recebendo
        ? { ...c, status: 'DIVERGENCIA', recebimento: divergenciaInfo }
        : c
      );
      setCompras(nova);
      saveCompras(nova);

      // Gerar notificação para ADMIN e COMPRAS
      const notifNova = {
        id: Date.now(),
        tipo: 'DIVERGENCIA_RECEBIMENTO',
        pedidoId: pedido.id,
        pedidoProduto: pedido.produto,
        criadoPor: user.nome,
        mensagem: `⚠️ ATENÇÃO: O produto "${pedido.produto}" pedido por ${pedido.criadoPor} chegou com divergência. ` +
          `Pedido: ${pedido.quantidade} un de "${pedido.produto}" ` +
          (pedido.modelo ? `(modelo: ${pedido.modelo})` : '') +
          (pedido.cor ? ` / cor: ${pedido.cor}` : '') +
          `. Recebido: ${recForm.quantidadeDivergente || pedido.quantidade} un` +
          (recForm.produtoDivergente ? ` de "${recForm.produtoDivergente}"` : '') +
          (recForm.modeloDivergente ? ` (modelo: ${recForm.modeloDivergente})` : '') +
          (recForm.corDivergente ? ` / cor: ${recForm.corDivergente}` : '') +
          `. NF: ${recForm.notaFiscal || 'não informada'}. Recebedor: ${user.nome}.`,
        paraAdmins: true,
        paraCompras: true,
        lida: false,
        criadoEm: agora,
      };
      const novasNotifs = [notifNova, ...notifs];
      setNotifs(novasNotifs);
      saveNotifs(novasNotifs);
      mostrarToast('Divergência registrada. Notificação enviada para Admin e Compras!', 'warning');
    }

    setRecebendo(null);
  }

  // ── Filtros ────────────────────────────────
  const lista = compras.filter(c => !filtroStatus || c.status === filtroStatus);

  // Notificações do usuário atual
  const minhasNotifs = notifs.filter(n =>
    (n.paraAdmins && user.perfil === 'ADMIN') ||
    (n.paraCompras && user.perfil === 'COMPRAS')
  );
  const naoLidas = minhasNotifs.filter(n => !n.lida).length;

  function marcarLida(id) {
    const nova = notifs.map(n => n.id === id ? { ...n, lida: true } : n);
    setNotifs(nova);
    saveNotifs(nova);
  }

  const pedidoAtual = compras.find(c => c.id === recebendo);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-semibold animate-fadein
          ${toast.tipo === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <LucideShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
            <p className="text-sm text-gray-500">Pedidos de compra e controle de recebimento</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Sino de notificações (só para ADMIN e COMPRAS) */}
          {(user.perfil === 'ADMIN' || user.perfil === 'COMPRAS') && naoLidas > 0 && (
            <span className="relative">
              <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded-full text-sm font-semibold">
                <LucideAlertTriangle className="w-4 h-4" />
                {naoLidas} divergência{naoLidas > 1 ? 's' : ''} nova{naoLidas > 1 ? 's' : ''}
              </span>
            </span>
          )}
          {can.gerenciarCompras && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold shadow transition"
            >
              <LucidePlus className="w-4 h-4" />
              Novo Pedido
            </button>
          )}
        </div>
      </div>

      {/* Notificações de divergência */}
      {(user.perfil === 'ADMIN' || user.perfil === 'COMPRAS') && minhasNotifs.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-2">Alertas de Recebimento</h3>
          {minhasNotifs.map(n => (
            <div key={n.id}
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm transition
                ${n.lida ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-red-50 border-red-300'}`}
            >
              <LucideAlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${n.lida ? 'text-gray-400' : 'text-red-500'}`} />
              <div className="flex-1">
                <p className={n.lida ? 'text-gray-500' : 'text-red-800 font-medium'}>{n.mensagem}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.criadoEm).toLocaleString('pt-BR')}</p>
              </div>
              {!n.lida && (
                <button onClick={() => marcarLida(n.id)} className="text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap">
                  Marcar lida
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário novo pedido */}
      {showForm && can.gerenciarCompras && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-6 mb-6 shadow-md animate-fadein">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Registrar Pedido de Compra</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <LucideX className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={salvarPedido} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Produto *</label>
              <input required className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.produto} onChange={e => setForm(f => ({ ...f, produto: e.target.value }))}
                placeholder="Nome do produto" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Modelo</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                placeholder="Ex: Tradicional 30mm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Cor</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                placeholder="Ex: Prata, Dourado..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Categoria</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                <option value="">Selecionar...</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Quantidade *</label>
              <input required type="number" min="1" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Fornecedor *</label>
              <input required className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))}
                placeholder="Nome do fornecedor" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Previsão de Entrega</label>
              <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
                value={form.previsaoEntrega} onChange={e => setForm(f => ({ ...f, previsaoEntrega: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Observação</label>
              <textarea rows={2} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 resize-none"
                value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                placeholder="Informações adicionais..." />
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow hover:opacity-90 transition">
                Registrar Pedido
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Filtrar por status:</span>
        {['', 'PENDENTE', 'RECEBIDO', 'DIVERGENCIA'].map(s => (
          <button key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition
              ${filtroStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
            {s === '' ? 'Todos' : STATUS_LABEL[s]?.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{lista.length} pedido{lista.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendentes',       s: 'PENDENTE',    color: 'from-amber-400 to-orange-500',  icon: LucideClock },
          { label: 'Recebidos',       s: 'RECEBIDO',    color: 'from-green-500 to-teal-500',    icon: LucideCheckCircle2 },
          { label: 'Divergências',    s: 'DIVERGENCIA', color: 'from-red-500 to-pink-500',      icon: LucideAlertCircle },
        ].map(({ label, s, color, icon: Icon }) => (
          <div key={s} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-4 flex items-center gap-4 shadow-md`}>
            <Icon className="w-8 h-8 opacity-80" />
            <div>
              <div className="text-2xl font-bold">{compras.filter(c => c.status === s).length}</div>
              <div className="text-sm opacity-90">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-3">
        {lista.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <LucideShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum pedido encontrado</p>
          </div>
        )}
        {lista.map(pedido => {
          const st = STATUS_LABEL[pedido.status];
          const aberto = expandido === pedido.id;
          return (
            <div key={pedido.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition
                ${pedido.status === 'DIVERGENCIA' ? 'border-red-300' : pedido.status === 'PENDENTE' ? 'border-amber-200' : 'border-green-200'}`}>
              {/* Cabeçalho do card */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandido(aberto ? null : pedido.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 truncate">{pedido.produto}</span>
                    {pedido.modelo && <span className="text-xs text-gray-500">| {pedido.modelo}</span>}
                    {pedido.cor && <span className="text-xs text-gray-500">| {pedido.cor}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                    <span>Qtd: <strong>{pedido.quantidade}</strong></span>
                    {pedido.categoria && <span>| {pedido.categoria}</span>}
                    <span>| Fornecedor: <strong>{pedido.fornecedor}</strong></span>
                    <span>| Por: {pedido.criadoPor}</span>
                    <span>| {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.color} whitespace-nowrap`}>
                  {st.label}
                </span>
                {/* Botão de recebimento (Expedição) */}
                {can.confirmarRecebimento && pedido.status === 'PENDENTE' && (
                  <button
                    onClick={e => { e.stopPropagation(); abrirRecebimento(pedido.id); }}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition whitespace-nowrap"
                  >
                    <LucideTruck className="w-3.5 h-3.5" />
                    Confirmar chegada
                  </button>
                )}
                {aberto ? <LucideChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                         : <LucideChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>

              {/* Detalhes expandidos */}
              {aberto && (
                <div className="border-t px-5 py-4 bg-gray-50 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm animate-fadein">
                  {pedido.previsaoEntrega && (
                    <div><span className="text-xs text-gray-400 uppercase">Previsão</span>
                      <p className="font-medium">{new Date(pedido.previsaoEntrega + 'T00:00:00').toLocaleDateString('pt-BR')}</p></div>
                  )}
                  {pedido.observacao && (
                    <div className="col-span-2"><span className="text-xs text-gray-400 uppercase">Observação</span>
                      <p className="font-medium">{pedido.observacao}</p></div>
                  )}
                  {pedido.recebimento && (
                    <>
                      <div className="col-span-3 border-t pt-3 mt-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Informações de Recebimento</span>
                      </div>
                      <div><span className="text-xs text-gray-400 uppercase">Data/Hora</span>
                        <p className="font-medium">{pedido.recebimento.dataRecebimento} às {pedido.recebimento.horaRecebimento}</p></div>
                      <div><span className="text-xs text-gray-400 uppercase">Nota Fiscal</span>
                        <p className="font-medium">{pedido.recebimento.notaFiscal || '—'}</p></div>
                      <div><span className="text-xs text-gray-400 uppercase">Fornecedor (real)</span>
                        <p className="font-medium">{pedido.recebimento.fornecedorReal || pedido.fornecedor}</p></div>
                      <div><span className="text-xs text-gray-400 uppercase">Qtd. Recebida</span>
                        <p className="font-medium">{pedido.recebimento.quantidadeRecebida}</p></div>
                      <div><span className="text-xs text-gray-400 uppercase">Recebido por</span>
                        <p className="font-medium">{pedido.recebimento.recebidoPor}</p></div>
                      {pedido.status === 'DIVERGENCIA' && (
                        <div className="col-span-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 mt-1">
                          <strong>⚠ Divergência:</strong>{' '}
                          {pedido.recebimento.produtoDivergente && `Produto: "${pedido.recebimento.produtoDivergente}". `}
                          {pedido.recebimento.modeloDivergente && `Modelo: ${pedido.recebimento.modeloDivergente}. `}
                          {pedido.recebimento.corDivergente && `Cor: ${pedido.recebimento.corDivergente}. `}
                          {pedido.recebimento.observacao}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL DE RECEBIMENTO ────────────────────── */}
      {recebendo && pedidoAtual && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadein">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <LucidePackageCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-gray-900">Confirmar Recebimento</h2>
              </div>
              <button onClick={() => setRecebendo(null)} className="text-gray-400 hover:text-gray-600">
                <LucideX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Resumo do pedido */}
              <div className="bg-indigo-50 rounded-xl p-3 mb-5 text-sm">
                <p className="font-bold text-indigo-800">Pedido: {pedidoAtual.produto}</p>
                <p className="text-indigo-600 text-xs mt-1">
                  {pedidoAtual.quantidade} un | {pedidoAtual.fornecedor}
                  {pedidoAtual.modelo ? ` | Modelo: ${pedidoAtual.modelo}` : ''}
                  {pedidoAtual.cor ? ` | Cor: ${pedidoAtual.cor}` : ''}
                </p>
              </div>

              <form onSubmit={confirmarRecebimento} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Data Recebimento</label>
                    <input type="date" required
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      value={recForm.dataRecebimento}
                      onChange={e => setRecForm(f => ({ ...f, dataRecebimento: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Hora</label>
                    <input type="time" required
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                      value={recForm.horaRecebimento}
                      onChange={e => setRecForm(f => ({ ...f, horaRecebimento: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Número da Nota Fiscal</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={recForm.notaFiscal} placeholder="NF-12345"
                    onChange={e => setRecForm(f => ({ ...f, notaFiscal: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Nome do Fornecedor (nota)</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={recForm.fornecedorReal} placeholder={pedidoAtual.fornecedor}
                    onChange={e => setRecForm(f => ({ ...f, fornecedorReal: e.target.value }))} />
                </div>

                {/* Divergência */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={hasDivergencia}
                      onChange={e => setHasDivergencia(e.target.checked)}
                      className="rounded" />
                    <span className="text-sm font-semibold text-red-700">
                      Chegou diferente do pedido (divergência)
                    </span>
                  </label>

                  {hasDivergencia && (
                    <div className="mt-3 space-y-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-fadein">
                      <p className="text-xs text-red-700 font-medium mb-2">
                        Preencha o que chegou de diferente — um alerta será enviado para Admin e Compras.
                      </p>
                      <div>
                        <label className="text-xs text-gray-600 uppercase font-semibold">Produto que chegou</label>
                        <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                          value={recForm.produtoDivergente} placeholder="(deixe em branco se mesmo produto)"
                          onChange={e => setRecForm(f => ({ ...f, produtoDivergente: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 uppercase font-semibold">Modelo recebido</label>
                          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                            value={recForm.modeloDivergente}
                            onChange={e => setRecForm(f => ({ ...f, modeloDivergente: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 uppercase font-semibold">Cor recebida</label>
                          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                            value={recForm.corDivergente}
                            onChange={e => setRecForm(f => ({ ...f, corDivergente: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 uppercase font-semibold">Quantidade recebida</label>
                        <input type="number" min="0" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                          value={recForm.quantidadeDivergente} placeholder={pedidoAtual.quantidade}
                          onChange={e => setRecForm(f => ({ ...f, quantidadeDivergente: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Observação</label>
                  <textarea rows={2} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    value={recForm.observacaoRecebimento}
                    onChange={e => setRecForm(f => ({ ...f, observacaoRecebimento: e.target.value }))} />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setRecebendo(null)}
                    className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit"
                    className={`px-5 py-2 rounded-lg text-white text-sm font-semibold shadow transition
                      ${hasDivergencia
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90'}`}>
                    {hasDivergencia ? '⚠ Registrar Divergência' : '✓ Confirmar Recebimento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
