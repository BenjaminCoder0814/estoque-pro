// Precos.jsx — Tabela de preços dos produtos
// ADMIN: edita preços inline | Demais perfis: somente visualização
import React, { useState, useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';

// localStorage
const PRECOS_KEY = 'zkPrecos';

function loadPrecos() {
  try {
    const raw = localStorage.getItem(PRECOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function savePrecos(obj) {
  localStorage.setItem(PRECOS_KEY, JSON.stringify(obj));
}

// Mapa de nomes de cores (reutilizado de Produtos.jsx)
const COR_MAP = {
  'preto': '#1a1a1a', 'branco': '#f5f5f5', 'vermelho': '#ef4444',
  'azul': '#3b82f6', 'verde': '#22c55e', 'amarelo': '#eab308',
  'laranja': '#f97316', 'roxo': '#a855f7', 'rosa': '#ec4899',
  'cinza': '#6b7280', 'marrom': '#92400e', 'dourado': '#ca8a04',
  'prata': '#94a3b8', 'transparente': '#e0e0e0',
};

function resolverCor(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (COR_MAP[s]) return COR_MAP[s];
  if (/^#[0-9a-f]{3,6}$/i.test(s)) return s;
  return null;
}

function corPeloNome(nome) {
  const lower = nome.toLowerCase();
  for (const [key, hex] of Object.entries(COR_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return null;
}

function formatBRL(val) {
  const n = Number(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Precos() {
  const { produtos } = useEstoque();
  const { user, can } = useAuth();

  const [precos, setPrecos] = useState(loadPrecos);
  const [editandoId, setEditandoId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroComPreco, setFiltroComPreco] = useState('');
  const [ordemPreco, setOrdemPreco] = useState('');

  const isAdmin = can.editarProdutos;

  const categorias = useMemo(
    () => [...new Set(produtos.map(p => p.categoria).filter(Boolean))].sort(),
    [produtos]
  );

  // Filtragem
  let lista = produtos.filter(p => {
    if (!p.ativo) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase()) && !p.codigo.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroCategoria && p.categoria !== filtroCategoria) return false;
    if (filtroComPreco === 'sim' && !precos[p.id]) return false;
    if (filtroComPreco === 'nao' && precos[p.id]) return false;
    return true;
  });

  if (ordemPreco === 'asc') lista = [...lista].sort((a, b) => (precos[a.id] || 0) - (precos[b.id] || 0));
  if (ordemPreco === 'desc') lista = [...lista].sort((a, b) => (precos[b.id] || 0) - (precos[a.id] || 0));

  // Stats
  const comPreco = lista.filter(p => precos[p.id]).length;

  function abrirEdicao(p) {
    setEditandoId(p.id);
    setEditVal(precos[p.id] != null ? String(precos[p.id]) : '');
  }

  function salvarPreco(id) {
    const val = parseFloat(editVal.replace(',', '.'));
    const novo = { ...precos };
    if (!isNaN(val) && val >= 0) {
      novo[id] = val;
    } else {
      delete novo[id];
    }
    setPrecos(novo);
    savePrecos(novo);
    setEditandoId(null);
    setEditVal('');
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditVal('');
  }

  function handleKeyDown(e, id) {
    if (e.key === 'Enter') salvarPreco(id);
    if (e.key === 'Escape') cancelarEdicao();
  }

  function limparPreco(id) {
    const novo = { ...precos };
    delete novo[id];
    setPrecos(novo);
    savePrecos(novo);
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Tabela de Preços <span className="text-base font-normal text-gray-400">({lista.length} produtos)</span>
          </h1>
          {isAdmin && (
            <p className="text-sm text-gray-400 mt-0.5">
              Clique no preço para editar · {comPreco} de {lista.length} com preço cadastrado
            </p>
          )}
          {!isAdmin && (
            <p className="text-sm text-gray-400 mt-0.5">Consulta de preços — somente visualização</p>
          )}
        </div>

        {/* Badge resumo */}
        <div className="flex gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-bold text-emerald-700">{comPreco}</div>
            <div className="text-xs text-emerald-500">Com preço</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-bold text-amber-700">{lista.length - comPreco}</div>
            <div className="text-xs text-amber-500">Sem preço</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-52"
          placeholder="Buscar nome ou código..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select className="border rounded-lg px-3 py-2 text-sm" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filtroComPreco} onChange={e => setFiltroComPreco(e.target.value)}>
          <option value="">Todos (preço)</option>
          <option value="sim">Com preço</option>
          <option value="nao">Sem preço</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={ordemPreco} onChange={e => setOrdemPreco(e.target.value)}>
          <option value="">Ordenação padrão</option>
          <option value="asc">Preço ↑ menor</option>
          <option value="desc">Preço ↓ maior</option>
        </select>
        {(busca || filtroCategoria || filtroComPreco || ordemPreco) && (
          <button
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg border border-gray-200 hover:border-red-300 transition"
            onClick={() => { setBusca(''); setFiltroCategoria(''); setFiltroComPreco(''); setOrdemPreco(''); }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Instrução inline edit (admin) */}
      {isAdmin && (
        <div className="mb-4 flex items-center gap-2 text-xs text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 w-fit">
          <span>💡</span>
          <span>Clique no valor da coluna <strong>Preço</strong> para editar. Pressione <kbd className="bg-white border rounded px-1">Enter</kbd> para salvar ou <kbd className="bg-white border rounded px-1">Esc</kbd> para cancelar.</span>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm select-none">
              <th className="p-3 text-left w-14">Img</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Categoria</th>
              <th className="p-3 text-center">Cor</th>
              <th
                className="p-3 text-center cursor-pointer hover:text-indigo-600 select-none"
                onClick={() => setOrdemPreco(o => o === 'asc' ? 'desc' : o === 'desc' ? '' : 'asc')}
              >
                Preço {ordemPreco === 'asc' ? '↑' : ordemPreco === 'desc' ? '↓' : '↕'}
              </th>
              <th className="p-3 text-center">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                  Nenhum produto encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
            {lista.map(p => {
              const hex = resolverCor(p.cor) || corPeloNome(p.nome);
              const temPreco = precos[p.id] != null;
              const editando = editandoId === p.id;

              return (
                <tr key={p.id} className="border-t text-sm hover:bg-gray-50 transition">
                  {/* Imagem */}
                  <td className="p-3">
                    {p.imagem
                      ? <img src={p.imagem} alt={p.nome} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📦</div>
                    }
                  </td>

                  {/* Nome */}
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{p.nome}</div>
                  </td>

                  {/* Código */}
                  <td className="p-3 text-gray-500 text-xs font-mono">{p.codigo}</td>

                  {/* Categoria */}
                  <td className="p-3 text-gray-500">{p.categoria}</td>

                  {/* Cor */}
                  <td className="p-3 text-center">
                    {hex
                      ? <span className="w-5 h-5 rounded-full border border-gray-300 shadow-sm inline-block" style={{ background: hex }} title={p.cor || 'detectada'} />
                      : <span className="text-gray-300">—</span>
                    }
                  </td>

                  {/* Preço */}
                  <td className="p-3 text-center">
                    {editando ? (
                      <div className="flex items-center gap-1 justify-center">
                        <span className="text-gray-400 text-xs">R$</span>
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 border-2 border-indigo-400 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => handleKeyDown(e, p.id)}
                          onBlur={() => salvarPreco(p.id)}
                          placeholder="0,00"
                        />
                      </div>
                    ) : isAdmin ? (
                      <button
                        onClick={() => abrirEdicao(p)}
                        className={`min-w-[80px] rounded-lg px-3 py-1 text-sm font-semibold transition border
                          ${temPreco
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-400 border-dashed border-gray-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300'
                          }`}
                      >
                        {temPreco ? formatBRL(precos[p.id]) : '+ Definir'}
                      </button>
                    ) : (
                      <span className={`font-semibold ${temPreco ? 'text-emerald-700' : 'text-gray-300'}`}>
                        {temPreco ? formatBRL(precos[p.id]) : '—'}
                      </span>
                    )}
                  </td>

                  {/* Estoque */}
                  <td className="p-3 text-center">
                    <span className={`font-bold text-base ${p.estoqueAtual <= p.estoqueMinimo ? 'text-red-600' : 'text-gray-700'}`}>
                      {p.estoqueAtual}
                    </span>
                    {p.estoqueAtual <= p.estoqueMinimo && (
                      <span className="ml-1 text-xs text-red-400">⚠</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota de rodapé */}
      <p className="text-xs text-gray-300 mt-4 text-right">
        Preços armazenados localmente · Última atualização por {user?.nome}
      </p>
    </div>
  );
}
