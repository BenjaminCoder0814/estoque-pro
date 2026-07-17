import React, { useState, useRef } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getColorFromName, getLabelFromHex, normalizeColorName } from '../utils/productColor';

const VAZIO = { nome: '', codigo: '', categoria: '', modelo: '', tamanho: '', material: '', cor: '', estoqueAtual: 0, estoqueMinimo: 0, controlaEstoque: true, geraAlerta: true, ativo: true, imagem: '', observacao: '' };

// Opções fixas da classificação de produtos (definido pela Diretoria – 2026)
const CATEGORIA_OPCOES = ['Numerado', 'Liso', 'Personalizado'];
const MODELO_OPCOES = ['DT', 'ES', 'EP'];
const NOME_OPCOES = [
  'Lacres DT PP',
  'Lacres DT PP CF',
  'Lacres ES PP ou NY',
  'Lacres ES PP CF',
  'Lacres EP',
];
const TAMANHO_OPCOES = ['16', '23', '27', '28'];

function withBase(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = import.meta.env.BASE_URL || '/';
  if (url.startsWith(base)) return url;
  if (url.startsWith('/')) return `${base}${url.slice(1)}`;
  return `${base}${url}`;
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
    if (lower.includes(chave)) return withBase(IMAGENS_PADRAO[chave]);
  }
  return '';
}

function normalizeFormColor(formColor) {
  const normalized = normalizeColorName(formColor);
  return normalized;
}

// Componente de imagem com fallback automático quando falha a carregar
function ImgProduto({ src, alt, className, fallback }) {
  const [erro, setErro] = React.useState(false);

  function cdn(url) {
    if (!url || typeof window === 'undefined') return url;
    const abs = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
    return `/.netlify/images?url=${encodeURIComponent(abs)}&w=600&fit=inside&auto=format`;
  }

  if (!src || erro) {
    return fallback || <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">—</div>;
  }
  const optimized = cdn(src);
  return (
    <img
      src={optimized || src}
      alt={alt}
      className={className}
      onError={() => setErro(true)}
      loading="lazy"
      decoding="async"
      width={64}
      height={64}
      fetchpriority="low"
    />
  );
}

export default function Produtos() {
  const { produtos, alertas, criarProduto, editarProduto, excluirProduto, syncStatus, carregando } = useEstoque();
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordemEstoque, setOrdemEstoque] = useState('');
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [obsProduto, setObsProduto] = useState(null);

  const alertaIds = new Set(alertas.map(p => p.id));
  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  const nomesSugestoes = [...new Set([...NOME_OPCOES, ...produtos.map(p => p.nome).filter(Boolean)])]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  const categoriasSugestoes = [...new Set([...CATEGORIA_OPCOES, ...categorias])]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  const modelosSugestoes = [...new Set([...MODELO_OPCOES, ...produtos.map(p => p.modelo).filter(Boolean)])]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  const tamanhosSugestoes = [...new Set([...TAMANHO_OPCOES, ...produtos.map(p => String(p.tamanho || '')).filter(Boolean)])]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  // Normaliza string: minúsculo + sem acentos (ex.: "Âncora" → "ancora")
  const norm = (s) => String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Helper que converte estoque em número de forma BLINDADA:
  // - aceita number, string com dígitos, string "17 un", null, undefined
  // - tudo que não resultar em número finito vira 0
  const toEstoque = (p) => {
    const raw = p?.estoqueAtual;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (raw == null) return 0;
    const s = String(raw).replace(/[^0-9\-.]/g, '').replace(/\.(?=.*\.)/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  // Produto é considerado ativo se ativo !== false (default true para registros antigos sem o campo)
  const isAtivo = (p) => p?.ativo !== false;

  const buscaN = norm(busca);

  let lista = [...produtos].filter(p => {
    if (buscaN) {
      const nomeN = norm(p?.nome);
      const codigoN = norm(p?.codigo);
      const categoriaN = norm(p?.categoria);
      if (!nomeN.includes(buscaN) && !codigoN.includes(buscaN) && !categoriaN.includes(buscaN)) {
        return false;
      }
    }
    if (filtroCategoria && p?.categoria !== filtroCategoria) return false;
    if (filtroAlerta === 'sim' && !alertaIds.has(p?.id)) return false;
    if (filtroAlerta === 'nao' && alertaIds.has(p?.id)) return false;
    if (filtroStatus === 'ativo' && !isAtivo(p)) return false;
    if (filtroStatus === 'inativo' && isAtivo(p)) return false;
    return true;
  });

  if (ordemEstoque === 'asc' || ordemEstoque === 'desc') {
    // Ordenação PURAMENTE numérica por estoque — sem desempate alfabético.
    const sign = ordemEstoque === 'desc' ? -1 : 1;
    lista.sort((a, b) => {
      const va = toEstoque(a);
      const vb = toEstoque(b);
      if (va === vb) return 0;
      return va < vb ? -sign : sign;
    });
    // Diagnóstico: mostra os 10 primeiros itens com seus valores numéricos reais
    // eslint-disable-next-line no-console
    console.log('[Produtos] ordem=' + ordemEstoque + ' → top 10:',
      lista.slice(0, 10).map(p => `${toEstoque(p)} | ${p.nome}`));
  }
  // ordemEstoque === '' → mantém a ordem original (sem alfabético, sem ordenação numérica)
  // SEM ordenação alfabética em hipótese nenhuma — padrão é a ordem original
  // do banco (que o usuário chama de "aleatória"). Só ordena quando o usuário
  // escolhe explicitamente asc/desc pelo estoque (critério puramente numérico).

  const filtrosAtivos = !!(busca || filtroCategoria || filtroAlerta || filtroStatus || ordemEstoque);
  function limparFiltros() {
    setBusca('');
    setFiltroCategoria('');
    setFiltroAlerta('');
    setFiltroStatus('');
    setOrdemEstoque('');
  }

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
    const estoqueAtual = Number.parseInt(String(form.estoqueAtual ?? '').replace(/\D/g, ''), 10);
    const estoqueMinimo = Number.parseInt(String(form.estoqueMinimo ?? '').replace(/\D/g, ''), 10);
    const dados = {
      ...form,
      nome: String(form.nome || '').trim(),
      categoria: String(form.categoria || '').trim(),
      modelo: String(form.modelo || '').trim(),
      tamanho: String(form.tamanho || '').trim(),
      material: String(form.material || '').trim(),
      cor: normalizeFormColor(form.cor),
      estoqueAtual: Number.isFinite(estoqueAtual) ? estoqueAtual : 0,
      estoqueMinimo: Number.isFinite(estoqueMinimo) ? estoqueMinimo : 0,
    };
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
        <div className="flex items-center gap-2">
          {can.criarSeparacao && (
            <button
              onClick={() => navigate('/separacoes')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
            >
              Reservar Produto
            </button>
          )}
          {can.editarProdutos && (
            <button onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition">
              + Novo Produto
            </button>
          )}
        </div>
      </div>

      {carregando && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Carregando o catálogo do banco de dados…
        </div>
      )}

      {syncStatus?.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {syncStatus.error}
        </div>
      )}

      <div className={`mb-4 rounded-lg border px-4 py-2 text-sm ${syncStatus?.ok ? (syncStatus?.degraded ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : 'bg-red-50 border-red-200 text-red-700'}`}>
        {!syncStatus?.ok
          ? 'Atenção: sem sincronização com API. Alterações podem não aparecer para todos até reconectar.'
          : syncStatus?.degraded
            ? `Sincronização parcial${syncStatus?.pendingEdits ? `: ${syncStatus.pendingEdits} alteração(ões) pendente(s) de envio` : ': produtos ao vivo e histórico com oscilação momentânea'}${syncStatus?.lastSync ? ` (${new Date(syncStatus.lastSync).toLocaleTimeString('pt-BR')})` : ''}`
            : `Sincronizado para todos os perfis${syncStatus?.lastSync ? ` (${new Date(syncStatus.lastSync).toLocaleTimeString('pt-BR')})` : ''}`}
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
          {[...new Set([...CATEGORIA_OPCOES, ...categorias])].map(c => <option key={c} value={c}>{c}</option>)}
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
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-sm shadow-sm" role="group" aria-label="Ordenar por estoque">
          <button
            type="button"
            onClick={() => setOrdemEstoque('')}
            className={`px-3 py-2 font-semibold transition ${ordemEstoque === '' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="Ordem padrão (original)"
          >↕ Padrão</button>
          <button
            type="button"
            onClick={() => setOrdemEstoque('desc')}
            className={`px-3 py-2 font-semibold border-l border-gray-300 transition ${ordemEstoque === 'desc' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="Maior estoque primeiro"
          >↓ Maior → Menor</button>
          <button
            type="button"
            onClick={() => setOrdemEstoque('asc')}
            className={`px-3 py-2 font-semibold border-l border-gray-300 transition ${ordemEstoque === 'asc' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="Menor estoque primeiro"
          >↑ Menor → Maior</button>
        </div>
        {filtrosAtivos && (
          <button
            type="button"
            onClick={limparFiltros}
            className="ml-auto text-sm text-gray-600 hover:text-red-600 underline px-2"
            title="Limpar todos os filtros"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Modal */}
      {showForm && can.editarProdutos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editandoId ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={salvar} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nome *</label>
                <input
                  required
                  list="produtos-nome-sugestoes"
                  className="border rounded-lg px-3 py-2 w-full mt-1"
                  value={form.nome}
                  onChange={handleNome}
                  placeholder="Digite o nome do produto"
                />
                <datalist id="produtos-nome-sugestoes">
                  {nomesSugestoes.map(n => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <input
                  list="produtos-categoria-sugestoes"
                  className="border rounded-lg px-3 py-2 w-full mt-1"
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  placeholder="Digite a categoria"
                />
                <datalist id="produtos-categoria-sugestoes">
                  {categoriasSugestoes.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="text-sm font-medium">Modelo</label>
                <input
                  list="produtos-modelo-sugestoes"
                  className="border rounded-lg px-3 py-2 w-full mt-1"
                  value={form.modelo}
                  onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                  placeholder="Digite o modelo"
                />
                <datalist id="produtos-modelo-sugestoes">
                  {modelosSugestoes.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div>
                <label className="text-sm font-medium">Tamanho</label>
                <input
                  list="produtos-tamanho-sugestoes"
                  className="border rounded-lg px-3 py-2 w-full mt-1"
                  value={form.tamanho}
                  onChange={e => setForm(f => ({ ...f, tamanho: e.target.value }))}
                  placeholder="Digite o tamanho"
                />
                <datalist id="produtos-tamanho-sugestoes">
                  {tamanhosSugestoes.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Material</label>
                <input className="border rounded-lg px-3 py-2 w-full mt-1" placeholder="Ex: PP, Nylon, Latão, Aço..." value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const colorInfo = getColorFromName(form.cor);
                    return (
                      <span
                        className="w-6 h-6 rounded-full inline-block"
                        style={{
                          backgroundColor: colorInfo.hex,
                          border: colorInfo.needsBorder ? '1px solid #D1D5DB' : '1px solid transparent',
                        }}
                        title={normalizeColorName(form.cor) || 'Sem cor padronizada'}
                      />
                    );
                  })()}
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded border p-0.5"
                    value={getColorFromName(form.cor).hex}
                    onChange={e => {
                      const canonical = getLabelFromHex(e.target.value);
                      if (!canonical) return;
                      setForm(f => ({ ...f, cor: canonical }));
                    }}
                  />
                  <input
                    className="border rounded-lg px-3 py-2 flex-1"
                    placeholder="ex: Preta, Vermelha, Lilás, Natural, Inox..."
                    value={form.cor}
                    onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">A bolinha segue exatamente o texto da cor com padronização automática.</p>
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

      {obsProduto && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">OBS</div>
                <h2 className="text-lg font-bold text-gray-900 mt-1 leading-snug">{obsProduto.nome}</h2>
              </div>
              <button
                type="button"
                onClick={() => setObsProduto(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-semibold"
              >
                Fechar
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-700 whitespace-pre-line">{obsProduto.observacao}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setObsProduto(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      {ordemEstoque && (
        <div className={`mb-3 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${ordemEstoque === 'desc' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          <span>Ordenando por estoque:</span>
          <span className="text-base">{ordemEstoque === 'desc' ? '↓ MAIOR para o MENOR' : '↑ MENOR para o MAIOR'}</span>
          <span className="ml-auto text-xs opacity-75">{lista.length} produtos · primeiro: {lista[0] ? `${toEstoque(lista[0])} (${lista[0].nome})` : '—'}</span>
        </div>
      )}
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
              <th className="p-3 text-center select-none">
                <span className="inline-flex items-center gap-1">
                  Estoque
                  {ordemEstoque === 'desc' && <span className="text-blue-600 font-bold" title="Maior para o menor">↓</span>}
                  {ordemEstoque === 'asc' && <span className="text-emerald-600 font-bold" title="Menor para o maior">↑</span>}
                </span>
              </th>
              <th className="p-3 text-center">Mínimo</th>
              <th className="p-3 text-center">Alerta</th>
              <th className="p-3 text-center">Status</th>
              {(can.editarProdutos || can.excluirProdutos) && <th className="p-3 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody key={`ord-${ordemEstoque}-${lista.length}`}>
            {lista.length === 0 && (
              <tr>
                <td colSpan={(can.editarProdutos || can.excluirProdutos) ? 12 : 11} className="text-center p-8 text-gray-400">Nenhum produto encontrado.</td>
              </tr>
            )}
            {lista.map((p, idx) => (
              <tr key={`${ordemEstoque}-${p.id}-${idx}`} className={`border-t text-sm hover:bg-gray-50 transition ${alertaIds.has(p.id) ? 'bg-red-50' : ''} ${p.categoria === 'Personalizado' ? 'bg-amber-50/60' : ''} ${!p.ativo ? 'opacity-50' : ''}`}>
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
                    {p.categoria === 'Personalizado' && (
                      <span
                        className="inline-flex items-center gap-1 bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap flex-shrink-0"
                        title={`Material exclusivo do cliente ${p.material || ''} — não vender para outros clientes`}
                      >
                        🔒 Cliente: {p.material || '—'}
                      </span>
                    )}
                    {alertaIds.has(p.id) && (
                      <span className="inline-flex items-center gap-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0">⚠ ALERTA</span>
                    )}
                    {p.observacao?.trim() && (
                      <button
                        type="button"
                        onClick={() => setObsProduto({ nome: p.nome, observacao: p.observacao })}
                        className="inline-flex items-center bg-sky-100 text-sky-700 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide hover:bg-sky-200 transition"
                        title="Ver observações do produto"
                      >
                        OBS
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3 text-gray-500">
                  {p.categoria === 'Personalizado'
                    ? <span className="inline-flex items-center bg-amber-100 text-amber-800 rounded px-2 py-0.5 text-xs font-semibold">Personalizado</span>
                    : p.categoria}
                </td>
                <td className="p-3 text-gray-500 text-xs">{p.modelo || <span className="text-gray-300">—</span>}</td>
                <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{p.tamanho || <span className="text-gray-300">—</span>}</td>
                <td className="p-3 text-gray-500 text-xs">{p.material || <span className="text-gray-300">—</span>}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center">
                    {(() => {
                      const colorInfo = getColorFromName(p.cor);
                      const label = normalizeColorName(p.cor) || p.cor || 'Sem cor';
                      return (
                        <span
                          className="w-5 h-5 rounded-full shadow-sm inline-block flex-shrink-0"
                          style={{
                            backgroundColor: colorInfo.hex,
                            border: colorInfo.needsBorder ? '1px solid #D1D5DB' : '1px solid transparent',
                          }}
                          title={label}
                        />
                      );
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


