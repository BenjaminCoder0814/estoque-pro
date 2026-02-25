import React, { useState, useRef } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';

const VAZIO = { nome: '', codigo: '', categoria: '', modelo: '', tamanho: '', material: '', cor: '', estoqueAtual: 0, estoqueMinimo: 0, controlaEstoque: true, geraAlerta: true, ativo: true, imagem: '' };

// Mapa de nomes de cores em português → hex
const COR_MAP = {
  'preto': '#1a1a1a', 'branco': '#f5f5f5', 'vermelho': '#ef4444',
  'azul': '#3b82f6', 'verde': '#22c55e', 'amarelo': '#eab308',
  'laranja': '#f97316', 'roxo': '#a855f7', 'rosa': '#ec4899',
  'cinza': '#9ca3af', 'marrom': '#92400e', 'dourado': '#ca8a04',
  'prata': '#cbd5e1', 'bege': '#d4b896', 'ciano': '#06b6d4',
  'azul claro': '#60a5fa', 'azul escuro': '#1e40af',
  'verde claro': '#86efac', 'verde escuro': '#15803d',
  'transparente': 'rgba(0,0,0,0.08)',
};

function resolverCor(cor) {
  if (!cor) return null;
  const lower = cor.toLowerCase().trim();
  return COR_MAP[lower] || cor;
}

// Detecta cor pelo nome do produto (ex: "Lacre Metálico Amarelo" → #eab308)
function corPeloNome(nome) {
  if (!nome) return null;
  const lower = nome.toLowerCase();
  // testa as chaves do mapa do maior para o menor (evita 'azul' sobrescrever 'azul claro')
  const chaves = Object.keys(COR_MAP).sort((a, b) => b.length - a.length);
  for (const chave of chaves) {
    if (lower.includes(chave)) return COR_MAP[chave];
  }
  return null;
}

// Mapeamento automático de imagens por palavras-chave no nome do produto
// Usa apenas caminhos locais (public/imagens/) para evitar bloqueios de CDN externo
const IMAGENS_PADRAO = {
  'cadeado':    '/imagens/cadeados/Cadeado Tradicional (latão).png',
  'fita':       '/imagens/Fitas/Fita adesiva.png',
  'isolante':   '/imagens/Fitas/Fita isolante.png',
  'silver':     '/imagens/Fitas/Fita silver tape.png',
  'zebrada':    '/imagens/Fitas/Fita zebrada.png',
  'crepe':      '/imagens/Fitas/Fita crepe.png',
  'abraçadeira':'/imagens/abracadeiras/Abraçadeira de Nylon — Padrão.png',
  'zfix':       '/imagens/abracadeiras/ZFIX — Base Adesiva.png',
  'lacre':      '/imagens/lacres-plasticos/ancora.png',
  'âncora':     '/imagens/lacres-plasticos/ancora.png',
  'arame':      '/imagens/Arames/Arame galvanizado para lacres (2 ou 3 fios).png',
  'amarrilho':  '/imagens/Arames/Amarrilho - Fecho de Arame (Twist Ties).png',
  'fitilho':    '/imagens/Arames/Fitilho plástico (PP) para amarração.png',
  'máquina':    '/imagens/maquinas/Máquina lacradora quadrada.png',
  'lacradora':  '/imagens/maquinas/Máquina lacradora quadrada.png',
  'seladora':   '/imagens/maquinas/Máquina seladora.png',
  'refil':      '/imagens/maquinas/Refil de selagem.png',
  'malote':     '/imagens/malotes/Malote Correio.png',
  'pasta':      '/imagens/malotes/Pasta para Documentos.png',
  'bolsa':      '/imagens/malotes/Bolsa com Zíper (estilo Sacola).png',
  'sacola':     '/imagens/malotes/Sacola com Rodízio.png',
  'urna':       '/imagens/malotes/Urna em Lona.png',
  'banner':     '/imagens/Banner.png',
};

function autoImagem(nome) {
  const lower = nome.toLowerCase();
  // Ordena do maior para o menor para evitar matches parciais
  const chaves = Object.keys(IMAGENS_PADRAO).sort((a, b) => b.length - a.length);
  for (const chave of chaves) {
    if (lower.includes(chave)) return IMAGENS_PADRAO[chave];
  }
  return '';
}

// Componente de imagem com fallback automático quando falha a carregar
function ImgProduto({ src, alt, className, fallback }) {
  const [erro, setErro] = React.useState(false);
  if (!src || erro) {
    return fallback || <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">—</div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setErro(true)} />;
}

export default function Produtos() {
  const { produtos, alertas, criarProduto, editarProduto, excluirProduto } = useEstoque();
  const { user, can } = useAuth();
  const fileRef = useRef();

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordemEstoque, setOrdemEstoque] = useState('');
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const alertaIds = new Set(alertas.map(p => p.id));
  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];

  let lista = produtos.filter(p =>
    (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo.toLowerCase().includes(busca.toLowerCase())) &&
    (!filtroCategoria || p.categoria === filtroCategoria) &&
    (!filtroAlerta || (filtroAlerta === 'sim' ? alertaIds.has(p.id) : !alertaIds.has(p.id))) &&
    (!filtroStatus || (filtroStatus === 'ativo' ? p.ativo : !p.ativo))
  );
  if (ordemEstoque === 'asc') lista = [...lista].sort((a, b) => a.estoqueAtual - b.estoqueAtual);
  if (ordemEstoque === 'desc') lista = [...lista].sort((a, b) => b.estoqueAtual - a.estoqueAtual);

  function abrirNovo() { setForm(VAZIO); setEditandoId(null); setShowForm(true); }
  function abrirEdicao(p) { setForm({ ...p }); setEditandoId(p.id); setShowForm(true); }

  function handleNome(e) {
    const nome = e.target.value;
    setForm(f => {
      const imagem = f.imagem || autoImagem(nome);
      return { ...f, nome, imagem };
    });
  }

  function handleImagem(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, imagem: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function salvar(e) {
    e.preventDefault();
    const dados = { ...form, estoqueAtual: Number(form.estoqueAtual), estoqueMinimo: Number(form.estoqueMinimo) };
    if (editandoId) editarProduto(editandoId, dados, user);
    else criarProduto(dados, user);
    setShowForm(false);
    setForm(VAZIO);
    setEditandoId(null);
  }

  function toggleAtivo(p) {
    editarProduto(p.id, { ...p, ativo: !p.ativo }, user);
  }

  function remover(id) {
    if (window.confirm('Confirma exclusão do produto?')) excluirProduto(id, user);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Produtos <span className="text-base font-normal text-gray-400">({lista.length})</span>
        </h1>
        {can.editarProdutos && (
          <button onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition">
            + Novo Produto
          </button>
        )}
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
        <select className="border rounded-lg px-3 py-2 text-sm" value={filtroAlerta} onChange={e => setFiltroAlerta(e.target.value)}>
          <option value="">Todos (alerta)</option>
          <option value="sim">Com alerta</option>
          <option value="nao">Sem alerta</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos (status)</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={ordemEstoque} onChange={e => setOrdemEstoque(e.target.value)}>
          <option value="">Ordenação padrão</option>
          <option value="asc">Estoque ↑ menor</option>
          <option value="desc">Estoque ↓ maior</option>
        </select>
      </div>

      {/* Modal */}
      {showForm && can.editarProdutos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editandoId ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={salvar} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nome *</label>
                <input required className="border rounded-lg px-3 py-2 w-full mt-1" value={form.nome} onChange={handleNome} />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <input className="border rounded-lg px-3 py-2 w-full mt-1" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} list="cats-list" />
                <datalist id="cats-list">{categorias.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="text-sm font-medium">Modelo</label>
                <input className="border rounded-lg px-3 py-2 w-full mt-1" placeholder="Ex: Dupla Trava, Tradicional..." value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Tamanho / Variação</label>
                <input className="border rounded-lg px-3 py-2 w-full mt-1" placeholder="Ex: 30mm, 150mm, 30x40..." value={form.tamanho} onChange={e => setForm(f => ({ ...f, tamanho: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Material</label>
                <input className="border rounded-lg px-3 py-2 w-full mt-1" placeholder="Ex: PP, Nylon, Latão, Aço..." value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded border p-0.5"
                    value={resolverCor(form.cor) && resolverCor(form.cor).startsWith('#') ? resolverCor(form.cor) : '#6b7280'}
                    onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 flex-1"
                    placeholder="ex: Preto, Vermelho, #3b82f6..."
                    value={form.cor}
                    onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Use o seletor ou digite o nome (Preto, Azul...) ou um código hex</p>
              </div>
              <div>
                <label className="text-sm font-medium">Estoque Atual</label>
                <input type="number" min="0" className="border rounded-lg px-3 py-2 w-full mt-1" value={form.estoqueAtual} onChange={e => setForm(f => ({ ...f, estoqueAtual: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Estoque Mínimo</label>
                <input type="number" min="0" className="border rounded-lg px-3 py-2 w-full mt-1" value={form.estoqueMinimo} onChange={e => setForm(f => ({ ...f, estoqueMinimo: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Imagem</label>
                <div className="flex gap-3 items-center mt-1">
                  <ImgProduto
                    src={form.imagem}
                    alt="preview"
                    className="w-16 h-16 object-contain rounded border"
                    fallback={<div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">Sem img</div>}
                  />
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => fileRef.current.click()} className="text-sm text-blue-600 hover:underline">Upload de imagem</button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagem} />
                    <input
                      className="border rounded px-2 py-1 text-xs w-52"
                      placeholder="ou cole URL..."
                      value={form.imagem && form.imagem.startsWith('data:') ? '' : form.imagem}
                      onChange={e => setForm(f => ({ ...f, imagem: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.controlaEstoque} onChange={e => setForm(f => ({ ...f, controlaEstoque: e.target.checked }))} />
                  Controla Estoque
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.geraAlerta} onChange={e => setForm(f => ({ ...f, geraAlerta: e.target.checked }))} />
                  Gera Alerta
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
                  Ativo
                </label>
              </div>
              <div className="col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm select-none">
              <th className="p-3 text-left">Imagem</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Categoria</th>
              <th className="p-3 text-left">Modelo</th>
              <th className="p-3 text-left">Tamanho</th>
              <th className="p-3 text-left">Material</th>
              <th className="p-3 text-center">Cor</th>
              <th className="p-3 text-center cursor-pointer hover:text-blue-600" onClick={() => setOrdemEstoque(o => o === 'asc' ? 'desc' : 'asc')}>
                Estoque {ordemEstoque === 'asc' ? '↑' : ordemEstoque === 'desc' ? '↓' : '↕'}
              </th>
              <th className="p-3 text-center">Mínimo</th>
              <th className="p-3 text-center">Alerta</th>
              <th className="p-3 text-center">Status</th>
              {(can.editarProdutos || can.excluirProdutos) && <th className="p-3 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center p-8 text-gray-400">Nenhum produto encontrado.</td>
              </tr>
            )}
            {lista.map(p => (
              <tr key={p.id} className={`border-t text-sm hover:bg-gray-50 transition ${alertaIds.has(p.id) ? 'bg-red-50' : ''} ${!p.ativo ? 'opacity-50' : ''}`}>
                <td className="p-3">
                  <ImgProduto
                    src={p.imagem}
                    alt={p.nome}
                    className="w-12 h-12 object-contain rounded"
                  />
                </td>
                <td className="p-3 font-medium max-w-[220px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="leading-snug">{p.nome}</span>
                    {alertaIds.has(p.id) && (
                      <span className="inline-flex items-center gap-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0">⚠ ALERTA</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-gray-500">{p.categoria}</td>
                <td className="p-3 text-gray-500 text-xs">{p.modelo || <span className="text-gray-300">—</span>}</td>
                <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{p.tamanho || <span className="text-gray-300">—</span>}</td>
                <td className="p-3 text-gray-500 text-xs">{p.material || <span className="text-gray-300">—</span>}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center">
                    {(() => {
                      const hex = resolverCor(p.cor) || corPeloNome(p.nome);
                      const label = p.cor || '';
                      return hex
                        ? <span
                            className="w-5 h-5 rounded-full border border-gray-300 shadow-sm inline-block flex-shrink-0"
                            style={{ background: hex }}
                            title={label || 'cor detectada pelo nome'}
                          />
                        : <span className="text-gray-300">—</span>;
                    })()}
                  </div>
                </td>
                <td className={`p-3 text-center font-bold text-lg ${alertaIds.has(p.id) ? 'text-red-600' : 'text-gray-800'}`}>
                  {p.estoqueAtual}
                </td>
                <td className="p-3 text-center text-gray-500">{p.estoqueMinimo}</td>
                <td className="p-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.geraAlerta ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                    {p.geraAlerta ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {can.editarProdutos
                    ? (
                      <button
                        onClick={() => toggleAtivo(p)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${p.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    )
                    : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                </td>
                {(can.editarProdutos || can.excluirProdutos) && (
                  <td className="p-3 text-center whitespace-nowrap">
                    {can.editarProdutos && (
                      <button onClick={() => abrirEdicao(p)} className="text-blue-600 hover:underline text-sm mr-3">Editar</button>
                    )}
                    {can.excluirProdutos && (
                      <button onClick={() => remover(p.id)} className="text-red-500 hover:underline text-sm">Excluir</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


