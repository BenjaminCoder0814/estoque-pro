// Midia.jsx — Galeria de mídia e design
// ADMIN: adiciona/remove itens | Todos os perfis: visualizam e acessam links
import React, { useState, useMemo } from 'react';
import {
  LucideImage, LucideFileText, LucideLayout, LucideFolderOpen,
  LucidePlus, LucideTrash2, LucideExternalLink, LucideDownload,
  LucideSearch, LucideX, LucideUpload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── localStorage ──────────────────────────────────────────────────────────
const MIDIA_KEY = 'zkMidia';

function loadMidia() {
  try {
    const raw = localStorage.getItem(MIDIA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMidia(arr) {
  localStorage.setItem(MIDIA_KEY, JSON.stringify(arr));
}

// ── Tipos ──────────────────────────────────────────────────────────────────
const TIPOS = [
  { id: 'foto',    label: 'Foto de Produto', icon: LucideImage,      cor: 'indigo'  },
  { id: 'pdf',     label: 'Catálogo PDF',    icon: LucideFileText,   cor: 'red'     },
  { id: 'banner',  label: 'Banner',          icon: LucideLayout,     cor: 'purple'  },
  { id: 'outro',   label: 'Outros',          icon: LucideFolderOpen, cor: 'gray'    },
];

const TIPO_MAP = Object.fromEntries(TIPOS.map(t => [t.id, t]));

const COR_CLASSES = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-400' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',       icon: 'text-red-400'    },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-400' },
  gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-600',     icon: 'text-gray-400'   },
};

const VAZIO_FORM = { nome: '', descricao: '', tipo: 'foto', url: '' };

// ── Helpers ────────────────────────────────────────────────────────────────
function isImage(url) {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) || url.startsWith('data:image');
}

function isPDF(url) {
  if (!url) return false;
  return /\.pdf(\?.*)?$/i.test(url) || url.startsWith('data:application/pdf');
}

function humanDate(iso) {
  try { return new Date(iso).toLocaleDateString('pt-BR'); }
  catch { return ''; }
}

// ── Componente ────────────────────────────────────────────────────────────
export default function Midia() {
  const { user, can } = useAuth();
  const isAdmin = !!can.editarProdutos;

  const [itens, setItens] = useState(loadMidia);
  const [abaAtiva, setAbaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(VAZIO_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null); // id a deletar
  const [previewImg, setPreviewImg] = useState(null); // url para modal preview

  // ── filtro ──────────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    return itens.filter(item => {
      if (abaAtiva !== 'todos' && item.tipo !== abaAtiva) return false;
      if (busca && !item.nome.toLowerCase().includes(busca.toLowerCase()) && !item.descricao?.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [itens, abaAtiva, busca]);

  // ── contagens por tipo ──────────────────────────────────────────────────
  const counts = useMemo(() => {
    const obj = { todos: itens.length };
    TIPOS.forEach(t => { obj[t.id] = itens.filter(i => i.tipo === t.id).length; });
    return obj;
  }, [itens]);

  // ── adicionar ──────────────────────────────────────────────────────────
  function handleAdicionar(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.url.trim()) return;
    const novo = {
      id: Date.now(),
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      url: form.url.trim(),
      addedBy: user?.nome || 'ADMIN',
      addedAt: new Date().toISOString(),
    };
    const novo_arr = [novo, ...itens];
    setItens(novo_arr);
    saveMidia(novo_arr);
    setForm(VAZIO_FORM);
    setShowForm(false);
  }

  // ── remover ─────────────────────────────────────────────────────────────
  function remover(id) {
    const novo_arr = itens.filter(i => i.id !== id);
    setItens(novo_arr);
    saveMidia(novo_arr);
    setConfirmDelete(null);
  }

  // ── abas ────────────────────────────────────────────────────────────────
  const abas = [
    { id: 'todos', label: 'Todos', icon: LucideFolderOpen },
    ...TIPOS.map(t => ({ id: t.id, label: t.label, icon: t.icon })),
  ];

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mídia & Design</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Fotos de produtos, catálogos PDF, banners e arquivos de design
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
          >
            <LucidePlus className="w-4 h-4" />
            Adicionar item
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {abas.map(aba => {
          const Icon = aba.icon;
          const ativo = abaAtiva === aba.id;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition
                ${ativo
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              <Icon className="w-4 h-4" />
              {aba.label}
              <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 font-bold
                ${ativo ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {counts[aba.id] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <div className="mb-5">
        <div className="relative w-72">
          <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="border rounded-lg pl-9 pr-3 py-2 text-sm w-full"
            placeholder="Buscar por nome ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <LucideX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid de cards */}
      {lista.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-gray-500 font-semibold">Nenhum arquivo encontrado</p>
          {isAdmin && (
            <p className="text-sm text-gray-400 mt-1">
              Clique em <strong>Adicionar item</strong> para incluir o primeiro arquivo.
            </p>
          )}
          {!isAdmin && abaAtiva === 'todos' && (
            <p className="text-sm text-gray-400 mt-1">Aguarde o administrador adicionar arquivos.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {lista.map(item => {
            const tipo = TIPO_MAP[item.tipo] || TIPO_MAP['outro'];
            const cor = COR_CLASSES[tipo.cor];
            const Icon = tipo.icon;
            const mostrarImagem = isImage(item.url);
            const mostrarPDF = isPDF(item.url) || item.tipo === 'pdf';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${cor.border}`}
              >
                {/* Preview */}
                <div
                  className={`relative flex items-center justify-center h-44 ${cor.bg} cursor-pointer`}
                  onClick={() => mostrarImagem && setPreviewImg(item.url)}
                >
                  {mostrarImagem ? (
                    <img
                      src={item.url}
                      alt={item.nome}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}

                  {/* Fallback / PDF / ícone */}
                  <div
                    className={`flex flex-col items-center justify-center gap-2 w-full h-full ${mostrarImagem ? 'hidden' : 'flex'}`}
                  >
                    <Icon className={`w-16 h-16 ${cor.icon} opacity-60`} />
                    {mostrarPDF && (
                      <span className="text-xs text-red-500 font-bold uppercase tracking-widest">PDF</span>
                    )}
                  </div>

                  {/* Badge tipo */}
                  <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${cor.badge}`}>
                    {tipo.label}
                  </span>

                  {/* Botão remover (admin) */}
                  {isAdmin && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(item.id); }}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-red-500 rounded-full p-1 transition shadow"
                      title="Remover"
                    >
                      <LucideTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Ícone lupa se imagem */}
                  {mostrarImagem && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="text-white text-xl">🔍</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{item.nome}</h3>
                  {item.descricao && (
                    <p className="text-xs text-gray-500 line-clamp-2">{item.descricao}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">
                      {humanDate(item.addedAt)} · {item.addedBy}
                    </span>
                    <div className="flex gap-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:text-indigo-700 p-1 rounded transition"
                        title="Abrir"
                      >
                        <LucideExternalLink className="w-4 h-4" />
                      </a>
                      <a
                        href={item.url}
                        download={item.nome}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition"
                        title="Baixar"
                      >
                        <LucideDownload className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Adicionar item ─────────────────────────────────────────── */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucideUpload className="w-5 h-5 text-indigo-500" />
                Adicionar arquivo / link
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                <LucideX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdicionar} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome *</label>
                <input
                  required
                  className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  placeholder="Ex: Foto Cadeado 30mm Preto"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {TIPOS.map(t => {
                    const Icon2 = t.icon;
                    const cor = COR_CLASSES[t.cor];
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition
                          ${form.tipo === t.id ? `${cor.bg} ${cor.border} ${cor.text} font-semibold` : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <input type="radio" name="tipo" value={t.id} checked={form.tipo === t.id}
                          onChange={() => setForm(f => ({ ...f, tipo: t.id }))} className="hidden" />
                        <Icon2 className="w-4 h-4" />
                        <span className="text-sm">{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">URL / Link *</label>
                <input
                  required
                  className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  placeholder="https://... ou link do Drive/Dropbox"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Cole o link de acesso ao arquivo. Para imagens, o link direto exibirá a prévia.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  rows={2}
                  className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none"
                  placeholder="Descrição opcional..."
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 justify-end mt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm shadow">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar exclusão ───────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-800 mb-2">Remover item?</h3>
            <p className="text-sm text-gray-500 mb-5">
              "{itens.find(i => i.id === confirmDelete)?.nome}" será removido da galeria. <br />
              <span className="text-xs text-gray-400">O arquivo original não será afetado.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <button onClick={() => remover(confirmDelete)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 text-sm shadow">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Preview imagem ──────────────────────────────────────────── */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setPreviewImg(null)}
        >
          <img
            src={previewImg}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
          >
            <LucideX className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
