// Midia.jsx — Galeria de mídia e design (v4 — beautiful redesign)
// Catálogo PDF com capa, fotos por categoria, banners e mídias salvas
import React, { useState, useMemo } from 'react';
import {
  LucideImage, LucideFileText, LucideLayout, LucideFolderOpen,
  LucidePlus, LucideTrash2, LucideExternalLink, LucideDownload,
  LucideSearch, LucideX, LucideUpload, LucideBookOpen, LucideEye,
  LucideChevronRight, LucideGrid3x3, LucideZoomIn,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── localStorage ──────────────────────────────────────────────────────────
const MIDIA_KEY = 'zkMidia';
function loadMidia() {
  try { const r = localStorage.getItem(MIDIA_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveMidia(arr) { localStorage.setItem(MIDIA_KEY, JSON.stringify(arr)); }

// ── Catálogo ───────────────────────────────────────────────────────────────
const CATALOG = {
  pdf:  '/imagens/Catálogo ZENITH.pdf',
  capa: '/imagens/Catálogo ZENITH capa.jpg',
};

// ── Banners fixos ──────────────────────────────────────────────────────────
const BANNERS_FIXOS = [
  { id: 'b1', nome: 'Banner Zenith', url: '/imagens/Banner.png', descricao: 'Material promocional Zenith' },
];

// ── Fotos por categoria ────────────────────────────────────────────────────
const FOTO_CATS = [
  {
    id: 'cadeados', label: 'Cadeados', emoji: '🔒',
    from: 'from-blue-400', to: 'to-blue-600',
    badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700', border: 'border-blue-200',
    fotos: [
      { nome: 'Cadeado Bloqueio',          url: '/imagens/cadeados/Cadeado Bloqueio.png' },
      { nome: 'Cadeado Colorido',          url: '/imagens/cadeados/Cadeado Colorido.png' },
      { nome: 'Cadeado Haste Longa',       url: '/imagens/cadeados/Cadeado Haste Longa.png' },
      { nome: 'Cadeado Segredo Igual',     url: '/imagens/cadeados/Cadeado segredo igual.png' },
      { nome: 'Cadeado Segredo Numérico',  url: '/imagens/cadeados/Cadeado Segredo Numérico.png' },
      { nome: 'Cadeado Tetra',             url: '/imagens/cadeados/Cadeado Tetra.png' },
      { nome: 'Cadeado Tradicional',       url: '/imagens/cadeados/Cadeado Tradicional (latão).png' },
    ],
  },
  {
    id: 'abracadeiras', label: 'Abraçadeiras', emoji: '🔗',
    from: 'from-emerald-400', to: 'to-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200',
    fotos: [
      { nome: 'Abraçadeira Padrão',        url: '/imagens/Abraçadeiras/Abraçadeira de Nylon — Padrão.png' },
      { nome: 'Abraçadeira Identificável', url: '/imagens/Abraçadeiras/Abraçadeira Identificável.png' },
      { nome: 'Abraçadeira Metálica',      url: '/imagens/Abraçadeiras/Abraçadeira Metálica.png' },
      { nome: 'ZFIX — Base Adesiva',       url: '/imagens/Abraçadeiras/ZFIX — Base Adesiva.png' },
    ],
  },
  {
    id: 'arames', label: 'Arames & Amarrilhos', emoji: '🪢',
    from: 'from-orange-400', to: 'to-orange-600',
    badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700', border: 'border-orange-200',
    fotos: [
      { nome: 'Amarrilho Twist Ties',     url: '/imagens/Arames/Amarrilho - Fecho de Arame (Twist Ties).png' },
      { nome: 'Arame Galvanizado',        url: '/imagens/Arames/Arame galvanizado para lacres (2 ou 3 fios).png' },
      { nome: 'Fitilho PP',               url: '/imagens/Arames/Fitilho plástico (PP) para amarração.png' },
    ],
  },
  {
    id: 'fitas', label: 'Fitas & Adesivos', emoji: '📦',
    from: 'from-yellow-400', to: 'to-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800', text: 'text-yellow-800', border: 'border-yellow-200',
    fotos: [
      { nome: 'Fita Adesiva',             url: '/imagens/Fitas/Fita adesiva.png' },
      { nome: 'Fita Crepe',               url: '/imagens/Fitas/Fita crepe.png' },
      { nome: 'Fita Dupla Face',          url: '/imagens/Fitas/Fita dupla face.png' },
      { nome: 'Fita Isolante Antichama',  url: '/imagens/Fitas/Fita isolante antichama.png' },
      { nome: 'Fita Isolante',            url: '/imagens/Fitas/Fita isolante.png' },
      { nome: 'Fita para Máquina',        url: '/imagens/Fitas/Fita para máquina lacradora.png' },
      { nome: 'Fita Silver Tape',         url: '/imagens/Fitas/Fita silver tape.png' },
      { nome: 'Fita Zebrada',             url: '/imagens/Fitas/Fita zebrada.png' },
      { nome: 'Lacre Etiqueta',           url: '/imagens/Fitas/Lacre etiqueta.png' },
      { nome: 'Suporte para Fita',        url: '/imagens/Fitas/Suporte para fita adesiva.png' },
    ],
  },
  {
    id: 'lacres-metalicos', label: 'Lacres Metálicos', emoji: '⚙️',
    from: 'from-slate-400', to: 'to-slate-600',
    badge: 'bg-slate-100 text-slate-700', text: 'text-slate-700', border: 'border-slate-200',
    fotos: [
      { nome: 'Lacre Amarelo 1',          url: '/imagens/Lacres metálicos/Amarelo 1.png' },
      { nome: 'Lacre Amarelo 2',          url: '/imagens/Lacres metálicos/Amarelo 2.png' },
      { nome: 'Lacre Amarelo 3',          url: '/imagens/Lacres metálicos/Amarelo 3.png' },
      { nome: 'Lacre Azul 1',             url: '/imagens/Lacres metálicos/Azul 1.png' },
      { nome: 'Lacre Azul 2',             url: '/imagens/Lacres metálicos/Azul 2.png' },
      { nome: 'Lacre Azul 3',             url: '/imagens/Lacres metálicos/Azul 3.png' },
      { nome: 'Lacre Azul 4',             url: '/imagens/Lacres metálicos/Azul 4.png' },
      { nome: 'Lacre Chumbo Sinete',      url: '/imagens/Lacres metálicos/lacre-chumbo-sinete.png' },
      { nome: 'Lacre Sextavado',          url: '/imagens/Lacres metálicos/lacre-sextavado.png' },
      { nome: 'Lacre Vermelho 1',         url: '/imagens/Lacres metálicos/Vermelho 1.png' },
      { nome: 'Lacre Vermelho 2',         url: '/imagens/Lacres metálicos/Vermelho 2.png' },
      { nome: 'Lacre Vermelho 3',         url: '/imagens/Lacres metálicos/Vermelho 3.png' },
      { nome: 'Lacre Vermelho 4',         url: '/imagens/Lacres metálicos/Vermelho 4.png' },
      { nome: 'ZAJUST Caixa Ajustável',   url: '/imagens/Lacres metálicos/zajuste-caixa-ajustavel.png' },
      { nome: 'ZLOCK 3 Folha Flandres',   url: '/imagens/Lacres metálicos/zlock-3-folha-flandres.png' },
      { nome: 'ZLOCK Manivela',           url: '/imagens/Lacres metálicos/zlock-manivela.png' },
      { nome: 'ZPINO Bolt Seal',          url: '/imagens/Lacres metálicos/zpino-bolt-seal.png' },
    ],
  },
  {
    id: 'lacres-plasticos', label: 'Lacres Plásticos', emoji: '🏷️',
    from: 'from-purple-400', to: 'to-purple-600',
    badge: 'bg-purple-100 text-purple-700', text: 'text-purple-700', border: 'border-purple-200',
    fotos: [
      { nome: 'Âncora',                   url: '/imagens/Lacres Plásticos/ancora.png' },
      { nome: 'Anel Extintor',            url: '/imagens/Lacres Plásticos/anel-extintor.png' },
      { nome: 'Aplicador Lacre Sacola',   url: '/imagens/Lacres Plásticos/aplicador-lacre-sacola.png' },
      { nome: 'Dupla Trava DT',           url: '/imagens/Lacres Plásticos/dupla-trava-dt.png' },
      { nome: 'Escada Alta ES',           url: '/imagens/Lacres Plásticos/escada-alta-es.png' },
      { nome: 'Espinha de Peixe',         url: '/imagens/Lacres Plásticos/espinha-de-peixe.png' },
      { nome: 'Lacre de Sacola ZNI',      url: '/imagens/Lacres Plásticos/Lacre de Sacola — Zni.png' },
      { nome: 'Lacre Caixas ALC',         url: '/imagens/Lacres Plásticos/lacre-caixas-alc.png' },
      { nome: 'Lacre TAG Autenticidade',  url: '/imagens/Lacres Plásticos/lacre-tag-autenticidade.png' },
      { nome: 'Trava Anel',               url: '/imagens/Lacres Plásticos/trava-anel.png' },
      { nome: 'ZLS TM 35 — Trava Metálica', url: '/imagens/Lacres Plásticos/ZLS TM 35 — Trava Metálica (TM).png' },
    ],
  },
  {
    id: 'malotes', label: 'Malotes & Bolsas', emoji: '💼',
    from: 'from-teal-400', to: 'to-teal-600',
    badge: 'bg-teal-100 text-teal-700', text: 'text-teal-700', border: 'border-teal-200',
    fotos: [
      { nome: 'Bolsa com Zíper',          url: '/imagens/Malotes, pastas e bolsas/Bolsa com Zíper (estilo Sacola).png' },
      { nome: 'Malote Correio',           url: '/imagens/Malotes, pastas e bolsas/Malote Correio.png' },
      { nome: 'Pasta para Documentos',    url: '/imagens/Malotes, pastas e bolsas/Pasta para Documentos.png' },
      { nome: 'Porta Sacola Supermercado',url: '/imagens/Malotes, pastas e bolsas/Porta Sacola Supermercado.png' },
      { nome: 'Sacola com Rodízio',       url: '/imagens/Malotes, pastas e bolsas/Sacola com Rodízio.png' },
      { nome: 'Urna em Lona',             url: '/imagens/Malotes, pastas e bolsas/Urna em Lona.png' },
    ],
  },
  {
    id: 'maquinas', label: 'Máquinas', emoji: '🔧',
    from: 'from-red-400', to: 'to-red-600',
    badge: 'bg-red-100 text-red-700', text: 'text-red-700', border: 'border-red-200',
    fotos: [
      { nome: 'Máquina Lacradora Quadrada', url: '/imagens/Máquinas/Máquina lacradora quadrada.png' },
      { nome: 'Máquina Lacradora Redonda',  url: '/imagens/Máquinas/Máquina lacradora redonda.png' },
      { nome: 'Máquina Seladora',           url: '/imagens/Máquinas/Máquina seladora.png' },
      { nome: 'Refil de Selagem',           url: '/imagens/Máquinas/Refil de selagem.png' },
    ],
  },
];

// ── Adicionados (localStorage) ─────────────────────────────────────────────
const TIPOS = [
  { id: 'foto',   label: 'Foto de Produto', icon: LucideImage,      cor: 'indigo'  },
  { id: 'pdf',    label: 'Catálogo PDF',    icon: LucideFileText,   cor: 'red'     },
  { id: 'banner', label: 'Banner',          icon: LucideLayout,     cor: 'purple'  },
  { id: 'outro',  label: 'Outros',          icon: LucideFolderOpen, cor: 'gray'    },
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

function humanDate(iso) {
  try { return new Date(iso).toLocaleDateString('pt-BR'); }
  catch { return ''; }
}

// ── Sub-componente: grade de fotos de uma categoria ────────────────────────
function FotoGrid({ fotos, onPreview }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {fotos.map(f => (
        <div
          key={f.url}
          onClick={() => onPreview(f.url, f.nome)}
          className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer
                     shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
        >
          <div className="aspect-square overflow-hidden bg-gray-50">
            <img
              src={f.url}
              alt={f.nome}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
              loading="lazy"
            />
          </div>
          {/* hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <LucideZoomIn className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          {/* nome */}
          <div className="p-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-600 leading-tight text-center truncate" title={f.nome}>{f.nome}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tabs de navegação ──────────────────────────────────────────────────────
const MAIN_TABS = [
  { id: 'catalogo',  label: 'Catálogo',        emoji: '📖' },
  { id: 'fotos',     label: 'Fotos de Produtos', emoji: '🖼️' },
  { id: 'banners',   label: 'Banners & Design', emoji: '🎨' },
  { id: 'salvos',    label: 'Mídias Salvas',    emoji: '🗂️' },
];

// ── Componente principal ───────────────────────────────────────────────────
export default function Midia() {
  const { user, can } = useAuth();
  const isAdmin = !!can.editarProdutos;

  const [tab, setTab] = useState('catalogo');
  const [itens, setItens] = useState(loadMidia);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(VAZIO_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [preview, setPreview] = useState(null); // { url, nome }

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
    const arr = [novo, ...itens];
    setItens(arr); saveMidia(arr);
    setForm(VAZIO_FORM); setShowForm(false);
  }

  function remover(id) {
    const arr = itens.filter(i => i.id !== id);
    setItens(arr); saveMidia(arr);
    setConfirmDelete(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 pt-8 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🎬</span> Mídia & Design
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Catálogo PDF · Fotos de produtos · Banners · Arquivos de design
            </p>
          </div>
          {isAdmin && tab === 'salvos' && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
            >
              <LucidePlus className="w-4 h-4" />
              Adicionar mídia
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {MAIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-all
                ${tab === t.id
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
            >
              <span>{t.emoji}</span>
              {t.label}
              {t.id === 'salvos' && itens.length > 0 && (
                <span className="ml-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {itens.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-8">

        {/* ─────────────────────────────────────────────────────────────────
            TAB: CATÁLOGO
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'catalogo' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Banner superior */}
              <div className="bg-gradient-to-r from-red-600 to-red-800 px-8 py-6 flex items-center gap-4">
                <LucideBookOpen className="w-10 h-10 text-white/80" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Catálogo Zenith</h2>
                  <p className="text-red-200 text-sm mt-0.5">
                    Tabela de produtos completa · Versão 2025
                  </p>
                </div>
              </div>

              <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                {/* Capa do catálogo */}
                <div className="flex-shrink-0">
                  <div
                    className="w-56 rounded-xl overflow-hidden shadow-lg border border-gray-200 cursor-pointer
                               hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
                    onClick={() => setPreview({ url: CATALOG.capa, nome: 'Catálogo Zenith — Capa' })}
                  >
                    <img
                      src={CATALOG.capa}
                      alt="Capa do Catálogo Zenith"
                      className="w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl
                                    flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <LucideZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center mt-2">Clique para ampliar</p>
                </div>

                {/* Info + botões */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Catálogo ZENITH — Tabela de Preços</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Catálogo completo com todos os produtos, especificações técnicas e tabela de preços atualizada.
                    Ideal para enviar aos clientes ou consultar durante o atendimento.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-6">
                    {/* Visualizar */}
                    <a
                      href={CATALOG.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white
                                 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      <LucideEye className="w-5 h-5" />
                      Visualizar PDF
                    </a>

                    {/* Baixar */}
                    <a
                      href={CATALOG.pdf}
                      download="Catálogo ZENITH.pdf"
                      className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white
                                 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      <LucideDownload className="w-5 h-5" />
                      Baixar para envio
                    </a>
                  </div>

                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-3 py-1 rounded-full">
                      📄 Formato PDF
                    </span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                      📅 Tabela 12/2025
                    </span>
                    <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                      ✅ Pronto para envio ao cliente
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dica de uso */}
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Como usar o catálogo</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Clique em <strong>Visualizar PDF</strong> para abrir diretamente no navegador.
                  Para enviar ao cliente, use <strong>Baixar para envio</strong> e compartilhe o arquivo pelo WhatsApp ou e-mail.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            TAB: FOTOS DE PRODUTOS
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'fotos' && (
          <div className="space-y-8">
            {/* Contador total */}
            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
                <LucideGrid3x3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  {FOTO_CATS.reduce((acc, c) => acc + c.fotos.length, 0)} fotos em{' '}
                  {FOTO_CATS.length} categorias
                </span>
              </div>
              <span className="text-xs text-gray-400">Clique em qualquer foto para ampliar</span>
            </div>

            {FOTO_CATS.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header da categoria */}
                <div className={`bg-gradient-to-r ${cat.from} ${cat.to} px-6 py-4 flex items-center gap-3`}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <div>
                    <h3 className="text-white font-bold text-base">{cat.label}</h3>
                    <p className="text-white/70 text-xs">{cat.fotos.length} foto{cat.fotos.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Grid de fotos */}
                <div className="p-5">
                  <FotoGrid fotos={cat.fotos} onPreview={(url, nome) => setPreview({ url, nome })} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            TAB: BANNERS & DESIGN
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'banners' && (
          <div className="space-y-6 max-w-5xl">
            <p className="text-sm text-gray-500">
              Material visual para divulgação, whatsapp e redes sociais.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BANNERS_FIXOS.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden
                                           hover:shadow-md transition-shadow">
                  {/* Preview do banner */}
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setPreview({ url: b.url, nome: b.nome })}
                  >
                    <img
                      src={b.url}
                      alt={b.nome}
                      className="w-full object-cover max-h-72"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all
                                    flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                        <LucideZoomIn className="w-4 h-4 text-gray-700" />
                        <span className="text-sm font-semibold text-gray-700">Ampliar</span>
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Banner
                    </span>
                  </div>

                  {/* Footer do card */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{b.nome}</p>
                      {b.descricao && <p className="text-xs text-gray-400">{b.descricao}</p>}
                    </div>
                    <a
                      href={b.url}
                      download={b.nome}
                      className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white
                                 text-xs font-semibold px-3 py-2 rounded-lg shadow transition"
                    >
                      <LucideDownload className="w-3.5 h-3.5" />
                      Baixar
                    </a>
                  </div>
                </div>
              ))}

              {/* Card ícone WhatsApp */}
              <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div
                  className="relative cursor-pointer group bg-green-50 flex items-center justify-center py-10"
                  onClick={() => setPreview({ url: '/imagens/icone wpp.png', nome: 'Ícone WhatsApp' })}
                >
                  <img
                    src="/imagens/icone wpp.png"
                    alt="Ícone WhatsApp"
                    className="h-40 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all
                                  flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                      <LucideZoomIn className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-semibold text-gray-700">Ampliar</span>
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Ícone
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Ícone WhatsApp Zenith</p>
                    <p className="text-xs text-gray-400">Para uso em perfil e divulgação</p>
                  </div>
                  <a
                    href="/imagens/icone wpp.png"
                    download="Ícone WhatsApp Zenith.png"
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white
                               text-xs font-semibold px-3 py-2 rounded-lg shadow transition"
                  >
                    <LucideDownload className="w-3.5 h-3.5" />
                    Baixar
                  </a>
                </div>
              </div>

              {/* Logo Zenith */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div
                  className="relative cursor-pointer group bg-gray-50 flex items-center justify-center py-10"
                  onClick={() => setPreview({ url: '/imagens/Logo da Zenith.jpg', nome: 'Logo Zenith' })}
                >
                  <img
                    src="/imagens/Logo da Zenith.jpg"
                    alt="Logo Zenith"
                    className="h-40 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all
                                  flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                      <LucideZoomIn className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-semibold text-gray-700">Ampliar</span>
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 bg-gray-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Logo
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Logo Zenith oficial</p>
                    <p className="text-xs text-gray-400">Logotipo em alta resolução</p>
                  </div>
                  <a
                    href="/imagens/Logo da Zenith.jpg"
                    download="Logo Zenith.jpg"
                    className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white
                               text-xs font-semibold px-3 py-2 rounded-lg shadow transition"
                  >
                    <LucideDownload className="w-3.5 h-3.5" />
                    Baixar
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            TAB: MÍDIAS SALVAS (localStorage)
        ──────────────────────────────────────────────────────────────────── */}
        {tab === 'salvos' && (
          <div className="space-y-5">
            {itens.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-3">🗂️</div>
                <p className="text-gray-500 font-semibold">Nenhuma mídia salva ainda</p>
                {isAdmin ? (
                  <p className="text-sm text-gray-400 mt-1">
                    Clique em <strong>Adicionar mídia</strong> para incluir links externos ou mídias extras.
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">O administrador pode adicionar mídias extras aqui.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {itens.map(item => {
                  const tipo = TIPO_MAP[item.tipo] || TIPO_MAP['outro'];
                  const cor = COR_CLASSES[tipo.cor];
                  const Icon = tipo.icon;
                  const exibeImg = isImage(item.url);

                  return (
                    <div key={item.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${cor.border}`}>
                      <div
                        className={`relative flex items-center justify-center h-44 ${cor.bg} cursor-pointer`}
                        onClick={() => exibeImg && setPreview({ url: item.url, nome: item.nome })}
                      >
                        {exibeImg ? (
                          <img src={item.url} alt={item.nome} className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                            <Icon className={`w-16 h-16 ${cor.icon} opacity-60`} />
                            {item.tipo === 'pdf' && <span className="text-xs text-red-500 font-bold uppercase tracking-widest">PDF</span>}
                          </div>
                        )}
                        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${cor.badge}`}>
                          {tipo.label}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDelete(item.id); }}
                            className="absolute top-2 right-2 bg-white/80 hover:bg-red-100 text-red-500 rounded-full p-1 transition shadow"
                          >
                            <LucideTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {exibeImg && (
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition flex items-center justify-center opacity-0 hover:opacity-100">
                            <LucideZoomIn className="w-8 h-8 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{item.nome}</h3>
                        {item.descricao && <p className="text-xs text-gray-500 line-clamp-2">{item.descricao}</p>}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400">
                            {humanDate(item.addedAt)} · {item.addedBy}
                          </span>
                          <div className="flex gap-1">
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                              className="text-indigo-500 hover:text-indigo-700 p-1 rounded transition">
                              <LucideExternalLink className="w-4 h-4" />
                            </a>
                            <a href={item.url} download={item.nome}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded transition">
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
          </div>
        )}
      </div>

      {/* ── Modal: Preview imagem full ────────────────────────────────────── */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 p-4 cursor-zoom-out"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={preview.url}
              alt={preview.nome}
              className="max-w-full max-h-[80vh] object-contain mx-auto rounded-xl shadow-2xl"
            />
            <p className="text-white/80 text-sm text-center mt-3 font-medium">{preview.nome}</p>
          </div>

          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
          >
            <LucideX className="w-5 h-5" />
          </button>
          <a
            href={preview.url}
            download={preview.nome}
            className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold text-sm transition"
            onClick={e => e.stopPropagation()}
          >
            <LucideDownload className="w-4 h-4" />
            Baixar
          </a>
        </div>
      )}

      {/* ── Modal: Adicionar mídia ─────────────────────────────────────────── */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <LucideUpload className="w-5 h-5 text-indigo-500" />
                Adicionar mídia externa
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <LucideX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdicionar} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome *</label>
                <input required
                  className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  placeholder="Ex: Foto Cadeado 30mm Preto"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {TIPOS.map(t => {
                    const I2 = t.icon;
                    const cc = COR_CLASSES[t.cor];
                    return (
                      <label key={t.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition
                          ${form.tipo === t.id ? `${cc.bg} ${cc.border} ${cc.text} font-semibold` : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="tipo" value={t.id} checked={form.tipo === t.id}
                          onChange={() => setForm(f => ({ ...f, tipo: t.id }))} className="hidden" />
                        <I2 className="w-4 h-4" />
                        <span className="text-sm">{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">URL / Link *</label>
                <input required
                  className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  placeholder="https://... ou link do Drive/Dropbox"
                  value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">Para imagens: link direto exibirá a prévia.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea rows={2}
                  className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-none"
                  placeholder="Descrição opcional..."
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
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

      {/* ── Modal: Confirmar exclusão ──────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-800 mb-2">Remover mídia?</h3>
            <p className="text-sm text-gray-500 mb-5">
              "{itens.find(i => i.id === confirmDelete)?.nome}" será removido da lista salva.
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
    </div>
  );
}
