// Módulo ENTRADA — ADMIN e EXPEDICAO
// Fluxo principal: preenche formulário → sistema soma no estoque
//   Se produto não existir → cria automaticamente
//   Se existir → atualiza quantidade
// Aba secundária: Pedidos Pendentes (criados pela equipe COMPRAS)
// Aba terciária:  Histórico de entradas recentes
import React, { useState, useMemo, useRef } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LucidePackagePlus, LucideClipboardList, LucideHistory,
  LucideCheck, LucideX, LucideSearch, LucideAlertTriangle,
  LucideCheckCircle, LucidePlus, LucideArrowDownToLine,
} from 'lucide-react';

const PENDENTES_KEY = 'zkPendentes';
const NOTIF_KEY     = 'zkNotificacoes';

function loadPendentes() {
  try { return JSON.parse(localStorage.getItem(PENDENTES_KEY) || '[]'); } catch { return []; }
}
function savePendentes(lista) { localStorage.setItem(PENDENTES_KEY, JSON.stringify(lista)); }

function addNotif(msg, tipo = 'alerta') {
  try {
    const lista = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    lista.unshift({ id: Date.now(), mensagem: msg, tipo, lida: false, criadoEm: new Date().toISOString() });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(lista.slice(0, 100)));
  } catch {}
}

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const FORM_VAZIO = {
  categoria: '', nome: '', modelo: '', tamanho: '', material: '', cor: '',
  quantidade: '', data: '', hora: '', observacao: '',
};

const TABS = [
  { id: 'nova',      label: 'Nova Entrada',       icon: LucidePackagePlus },
  { id: 'pendentes', label: 'Pedidos Pendentes',   icon: LucideClipboardList },
  { id: 'historico', label: 'Histórico',            icon: LucideHistory },
];

export default function Entrada() {
  const { produtos, criarProduto, editarProduto, registrarMovimentacao } = useEstoque();
  const { user } = useAuth();

  const [aba, setAba]           = useState('nova');
  const [form, setForm]         = useState(() => {
    const agora = new Date();
    return {
      ...FORM_VAZIO,
      data: agora.toISOString().slice(0, 10),
      hora: agora.toTimeString().slice(0, 5),
    };
  });
  const [busca, setBusca]       = useState('');
  const [resultados, setResultados] = useState([]);
  const [prodSelecionado, setProdSelecionado] = useState(null);
  const [modoNovo, setModoNovo] = useState(false);
  const [pendentes, setPendentes] = useState(loadPendentes);
  const [modalConfirmar, setModalConfirmar] = useState(null);
  const [formConfirmar, setFormConfirmar]   = useState({ quantidade: '', cor: '', observacao: '', data: '', hora: '' });
  const [toast, setToast]       = useState(null);
  const buscaRef = useRef(null);

  function mostrarToast(msg, tipo = 'ok') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  // ── BUSCA DE PRODUTOS ────────────────────────────────────────────────────
  function pesquisar(q) {
    setBusca(q);
    if (!q.trim()) { setResultados([]); return; }
    const lower = q.toLowerCase();
    const found = produtos
      .filter(p => p.ativo &&
        (p.nome?.toLowerCase().includes(lower) ||
         p.codigo?.toLowerCase().includes(lower) ||
         p.modelo?.toLowerCase().includes(lower) ||
         p.categoria?.toLowerCase().includes(lower))
      )
      .slice(0, 8);
    setResultados(found);
  }

  function selecionarProduto(p) {
    setProdSelecionado(p);
    setModoNovo(false);
    setBusca(p.nome);
    setResultados([]);
    setForm(f => ({
      ...f,
      nome:      p.nome,
      categoria: p.categoria,
      modelo:    p.modelo || '',
      tamanho:   p.tamanho || '',
      material:  p.material || '',
      cor:       p.cor || '',
    }));
  }

  function naoEncontrado() {
    setProdSelecionado(null);
    setModoNovo(true);
    setResultados([]);
    setForm(f => ({ ...f, nome: busca }));
  }

  function limparSelecao() {
    setProdSelecionado(null);
    setModoNovo(false);
    setBusca('');
    setResultados([]);
    setForm({ ...FORM_VAZIO, data: form.data, hora: form.hora });
  }

  // ── REGISTRAR ENTRADA ─────────────────────────────────────────────────────
  function handleEntrada(e) {
    e.preventDefault();
    const qtd = Number(form.quantidade);
    if (!qtd || qtd < 1) { mostrarToast('Informe uma quantidade válida.', 'erro'); return; }
    if (!form.nome.trim()) { mostrarToast('Informe o nome do produto.', 'erro'); return; }

    if (modoNovo) {
      // Cria novo produto
      const nowIso = new Date().toISOString();
      const codigo = `ENT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const novoProd = {
        nome:            form.nome.trim(),
        codigo,
        categoria:       form.categoria.trim() || 'Sem categoria',
        modelo:          form.modelo.trim(),
        tamanho:         form.tamanho.trim(),
        material:        form.material.trim(),
        cor:             form.cor.trim(),
        estoqueAtual:    qtd,
        estoqueMinimo:   0,
        controlaEstoque: true,
        geraAlerta:      false,
        ativo:           true,
        imagem:          '',
        criadoEm:        nowIso,
        atualizadoEm:    nowIso,
        ultimaAtualizacao: `${form.data} ${form.hora}`,
        atualizadoPor:   user?.email || '',
      };
      const criado = criarProduto(novoProd, user);
      // Registra movimentação também
      registrarMovimentacao({
        produtoId:  criado.id,
        tipo:       'ENTRADA',
        quantidade: qtd,
        observacao: form.observacao.trim() || 'Entrada direta via módulo Entrada',
      }, user);
      mostrarToast(`✅ Produto "${novoProd.nome}" criado e estoque adicionado (${qtd} unid.)!`);
      limparSelecao();
      return;
    }

    if (prodSelecionado) {
      // Atualiza produto existente
      const { erro } = registrarMovimentacao({
        produtoId:  prodSelecionado.id,
        tipo:       'ENTRADA',
        quantidade: qtd,
        observacao: form.observacao.trim() || 'Entrada direta',
      }, user);
      if (erro) { mostrarToast(`Erro: ${erro}`, 'erro'); return; }
      // Atualiza campo ultimaAtualizacao e atualizadoPor
      editarProduto(prodSelecionado.id, {
        ultimaAtualizacao: `${form.data} ${form.hora}`,
        atualizadoPor: user?.email || '',
        ...(form.cor && form.cor !== prodSelecionado.cor ? { cor: form.cor } : {}),
      }, user);
      mostrarToast(`✅ Entrada de ${qtd} unid. registrada em "${prodSelecionado.nome}"!`);
      limparSelecao();
      return;
    }

    mostrarToast('Selecione um produto ou marque como novo.', 'erro');
  }

  // ── CONFIRMAR PEDIDO PENDENTE ────────────────────────────────────────────
  function abrirConfirmar(pedido) {
    const agora = new Date();
    setFormConfirmar({
      quantidade: String(pedido.quantidadePedida || ''),
      cor: '', observacao: '',
      data: agora.toISOString().slice(0, 10),
      hora: agora.toTimeString().slice(0, 5),
    });
    setModalConfirmar(pedido);
  }

  function confirmarPedido(e) {
    e.preventDefault();
    const qtdRecebida = Number(formConfirmar.quantidade);
    if (!qtdRecebida || qtdRecebida < 1) return;
    const pedido = modalConfirmar;
    const produto = produtos.find(p => p.id === pedido.produtoId);

    if (produto) {
      const { erro } = registrarMovimentacao({
        produtoId:  produto.id,
        tipo:       'ENTRADA',
        quantidade: qtdRecebida,
        observacao: formConfirmar.observacao || `Pedido confirmado — solicitado: ${pedido.quantidadePedida}`,
      }, user);
      if (erro) { mostrarToast(`Erro: ${erro}`, 'erro'); setModalConfirmar(null); return; }
      editarProduto(produto.id, {
        ultimaAtualizacao: `${formConfirmar.data} ${formConfirmar.hora}`,
        atualizadoPor: user?.email || '',
      }, user);
    }

    const divergencia = pedido.quantidadePedida && qtdRecebida !== pedido.quantidadePedida;
    const novo = pendentes.map(p =>
      p.id === pedido.id
        ? { ...p, status: divergencia ? 'DIVERGENCIA' : 'RECEBIDO',
            quantidadeRecebida: qtdRecebida,
            realizadaPor: user?.nome || '',
            realizadaEm: new Date().toISOString() }
        : p
    );
    setPendentes(novo);
    savePendentes(novo);

    if (divergencia) {
      addNotif(
        `⚠️ Divergência em "${pedido.produtoNome}": pedido ${pedido.quantidadePedida}, recebido ${qtdRecebida}.`,
        'divergencia'
      );
    }

    mostrarToast(divergencia
      ? `⚠️ Entrada com divergência registrada para "${pedido.produtoNome}".`
      : `✅ Pedido confirmado — ${qtdRecebida} unid. de "${pedido.produtoNome}"!`
    );
    setModalConfirmar(null);
  }

  // ── DADOS DAS ABAS ────────────────────────────────────────────────────────
  const pendentesAtivos = useMemo(
    () => [...pendentes.filter(p => p.status === 'PENDENTE')]
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)),
    [pendentes]
  );

  const historico = useMemo(
    () => [...pendentes.filter(p => ['RECEBIDO', 'DIVERGENCIA'].includes(p.status))]
      .sort((a, b) => new Date(b.realizadaEm || b.criadoEm) - new Date(a.realizadaEm || a.criadoEm)),
    [pendentes]
  );

  const categorias = useMemo(() => [...new Set(produtos.map(p => p.categoria))].sort(), [produtos]);

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-semibold flex items-center gap-2 text-white transition
          ${toast.tipo === 'erro' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.tipo === 'erro'
            ? <LucideX className="w-4 h-4" />
            : <LucideCheck className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LucideArrowDownToLine className="w-6 h-6 text-emerald-600" />
          Entrada de Materiais
        </h1>
        <p className="text-gray-500 text-sm mt-1">Registre recebimentos e atualize o estoque automaticamente.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = t.id === 'pendentes' ? pendentesAtivos.length : null;
          return (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
                ${aba === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {count != null && count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ ABA: NOVA ENTRADA ═══ */}
      {aba === 'nova' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
            <h2 className="font-bold text-emerald-800 flex items-center gap-2">
              <LucidePackagePlus className="w-5 h-5" />
              Registrar Recebimento
            </h2>
            <p className="text-emerald-600 text-xs mt-0.5">
              Busque um produto existente ou cadastre um novo. O estoque será atualizado automaticamente.
            </p>
          </div>

          <form onSubmit={handleEntrada} className="p-6 space-y-5">

            {/* Busca de produto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Produto <span className="text-red-500">*</span>
              </label>

              {!prodSelecionado && !modoNovo ? (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={buscaRef}
                        className="border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                        placeholder="Buscar por nome, código ou modelo..."
                        value={busca}
                        onChange={e => pesquisar(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {busca && (
                      <button
                        type="button"
                        onClick={naoEncontrado}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                      >
                        <LucidePlus className="w-4 h-4" />
                        Cadastrar novo
                      </button>
                    )}
                  </div>

                  {resultados.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {resultados.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selecionarProduto(p)}
                          className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between gap-4 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{p.nome}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {[p.codigo, p.categoria, p.modelo, p.tamanho].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ${p.estoqueAtual <= p.estoqueMinimo ? 'text-red-500' : 'text-emerald-600'}`}>
                            {p.estoqueAtual} un.
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {busca && resultados.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1.5 px-1">
                      Nenhum produto encontrado para "{busca}". Clique em "Cadastrar novo" para criar.
                    </p>
                  )}
                </div>
              ) : (
                <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 ${modoNovo ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}>
                  <div className="flex-1 min-w-0">
                    {modoNovo
                      ? <>
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Novo produto</span>
                          <p className="font-semibold text-gray-800 text-sm truncate">{busca || form.nome}</p>
                        </>
                      : <>
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Produto encontrado</span>
                          <p className="font-semibold text-gray-800 text-sm truncate">{prodSelecionado.nome}</p>
                          <p className="text-xs text-gray-400">{prodSelecionado.codigo} · Estoque atual: <strong>{prodSelecionado.estoqueAtual}</strong></p>
                        </>
                    }
                  </div>
                  <button type="button" onClick={limparSelecao} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition">
                    <LucideX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Campos do formulário - mostrados após selecionar ou marcar como novo */}
            {(prodSelecionado || modoNovo) && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modoNovo && (
                    <>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Nome do Produto *</label>
                        <input
                          required
                          className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.nome}
                          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                          placeholder="Nome completo do produto"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Categoria</label>
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.categoria}
                          onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                          list="cats-list"
                          placeholder="Ex: Cadeados, Lacres..."
                        />
                        <datalist id="cats-list">{categorias.map(c => <option key={c} value={c} />)}</datalist>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Modelo</label>
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.modelo}
                          onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                          placeholder="Ex: Dupla Trava, Tradicional..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Tamanho / Variação</label>
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.tamanho}
                          onChange={e => setForm(f => ({ ...f, tamanho: e.target.value }))}
                          placeholder="Ex: 16mm, 30x40, M..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Material</label>
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.material}
                          onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                          placeholder="Ex: PP, Nylon, Latão..."
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Cor</label>
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={form.cor}
                      onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                      placeholder="Ex: Amarelo, Azul, Natural..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Quantidade Recebida *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={form.quantidade}
                      onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Data *</label>
                    <input
                      required
                      type="date"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={form.data}
                      onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Hora *</label>
                    <input
                      required
                      type="time"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={form.hora}
                      onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Observação</label>
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 w-full mt-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    value={form.observacao}
                    onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                    placeholder="Nota fiscal, fornecedor, observações..."
                  />
                </div>

                {modoNovo && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <LucideAlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-700 text-xs">
                      Produto novo será <strong>cadastrado automaticamente</strong> no sistema com o estoque informado.
                      Você pode editar os detalhes depois na aba <strong>Produtos</strong>.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm"
                  >
                    <LucideArrowDownToLine className="w-4 h-4" />
                    Registrar Entrada
                  </button>
                  <button type="button" onClick={limparSelecao} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition text-sm">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* ═══ ABA: PEDIDOS PENDENTES ═══ */}
      {aba === 'pendentes' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-amber-800 flex items-center gap-2">
                <LucideClipboardList className="w-5 h-5" />
                Pedidos Pendentes
              </h2>
              <p className="text-amber-600 text-xs mt-0.5">
                Pedidos criados pela equipe de Compras aguardando confirmação de chegada.
              </p>
            </div>
            {pendentesAtivos.length > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {pendentesAtivos.length}
              </span>
            )}
          </div>

          {pendentesAtivos.length === 0 ? (
            <div className="text-center py-16">
              <LucideCheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum pedido pendente</p>
              <p className="text-gray-400 text-sm mt-1">Todos os pedidos foram confirmados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendentesAtivos.map(pedido => (
                <div key={pedido.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{pedido.produtoNome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pedido.produtoCodigo} · {pedido.produtoCategoria}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Qtd solicitada:</span> {pedido.quantidadePedida} ·{' '}
                      <span className="font-medium">Por:</span> {pedido.autor} ·{' '}
                      {fmt(pedido.criadoEm)}
                    </p>
                    {pedido.observacaoPedido && (
                      <p className="text-xs text-gray-400 italic mt-0.5">"{pedido.observacaoPedido}"</p>
                    )}
                  </div>
                  <button
                    onClick={() => abrirConfirmar(pedido)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                  >
                    <LucideCheck className="w-4 h-4" />
                    Confirmar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ABA: HISTÓRICO ═══ */}
      {aba === 'historico' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <LucideHistory className="w-5 h-5 text-blue-500" />
              Histórico de Entradas Confirmadas
            </h2>
          </div>

          {historico.length === 0 ? (
            <div className="text-center py-16">
              <LucideHistory className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma entrada confirmada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs">Produto</th>
                    <th className="px-4 py-3 text-center text-gray-500 font-medium text-xs">Pedido</th>
                    <th className="px-4 py-3 text-center text-gray-500 font-medium text-xs">Recebido</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs">Status</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs">Confirmado por</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium text-xs">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historico.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs">{p.produtoNome}</p>
                        <p className="text-gray-400 text-xs">{p.produtoCodigo}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">{p.quantidadePedida}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-sm ${p.quantidadeRecebida !== p.quantidadePedida ? 'text-orange-500' : 'text-emerald-600'}`}>
                          {p.quantidadeRecebida}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'DIVERGENCIA'
                          ? <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">Divergência</span>
                          : <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">Recebido</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.realizadaPor}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(p.realizadaEm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL CONFIRMAR PEDIDO ═══ */}
      {modalConfirmar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">Confirmar Chegada</h3>
              <button onClick={() => setModalConfirmar(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <LucideX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={confirmarPedido} className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <p className="font-semibold text-gray-800">{modalConfirmar.produtoNome}</p>
                <p className="text-gray-500 text-xs">{modalConfirmar.produtoCodigo}</p>
                <p className="text-gray-600 mt-1">Solicitado: <strong>{modalConfirmar.quantidadePedida} unid.</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Qtd Recebida *</label>
                  <input
                    required type="number" min="1"
                    className="border rounded-lg px-3 py-2 w-full mt-1 text-sm font-bold"
                    value={formConfirmar.quantidade}
                    onChange={e => setFormConfirmar(f => ({ ...f, quantidade: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Cor</label>
                  <input
                    className="border rounded-lg px-3 py-2 w-full mt-1 text-sm"
                    value={formConfirmar.cor}
                    onChange={e => setFormConfirmar(f => ({ ...f, cor: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Data</label>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 w-full mt-1 text-sm"
                    value={formConfirmar.data}
                    onChange={e => setFormConfirmar(f => ({ ...f, data: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Hora</label>
                  <input
                    type="time"
                    className="border rounded-lg px-3 py-2 w-full mt-1 text-sm"
                    value={formConfirmar.hora}
                    onChange={e => setFormConfirmar(f => ({ ...f, hora: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Observação</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full mt-1 text-sm"
                  value={formConfirmar.observacao}
                  onChange={e => setFormConfirmar(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Opcional..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  <LucideCheck className="w-4 h-4" /> Confirmar
                </button>
                <button type="button" onClick={() => setModalConfirmar(null)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
