// Precos.jsx — Catálogo comercial com preços por categoria/produto/variação
// ADMIN: edita tudo | SUPERVISAO + COMERCIAL: somente visualização
import React, { useState, useMemo, useCallback } from 'react';
import {
  LucideChevronDown, LucideChevronRight, LucidePlus,
  LucidePencil, LucideTrash2, LucideX,
  LucideSearch, LucideTag, LucidePackage, LucideInfo
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── localStorage ───────────────────────────────────────────────────────────
const CAT_KEY     = 'zkCatalogo';
const CAT_VERSION = 'v1';
const CAT_VER_KEY = 'zkCatalogoVersion';

// ── Seed inicial do catálogo ───────────────────────────────────────────────
// Estrutura: categoria > produto > variações (cada variação é um SKU comercial)
const CATALOGO_SEED = [
  {
    id: 1, categoria: 'Lacres Plásticos',
    produtos: [
      { id: 101, nome: 'Dupla Trava', variacoes: [
        { id: 10101, tamanho: '16', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '10-15 dias', obs: '' },
        { id: 10102, tamanho: '23', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '10-15 dias', obs: '' },
        { id: 10103, tamanho: '31', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '10-15 dias', obs: '' },
        { id: 10104, tamanho: '45', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '10-15 dias', obs: '' },
      ]},
      { id: 102, nome: 'Escada Alta', variacoes: [
        { id: 10201, tamanho: '30', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 10202, tamanho: '40', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 103, nome: 'Ancora', variacoes: [
        { id: 10301, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 104, nome: 'Espinha de Peixe', variacoes: [
        { id: 10401, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 105, nome: 'Lacre de Sacola — Zni', variacoes: [
        { id: 10501, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 106, nome: 'Lacre para Caixas ALC', variacoes: [
        { id: 10601, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 107, nome: 'Trava Anel', variacoes: [
        { id: 10701, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 108, nome: 'Anel Extintor', variacoes: [
        { id: 10801, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 109, nome: 'Lacre Tag Autenticidade', variacoes: [
        { id: 10901, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 110, nome: 'ZLS TM 35 — Trava Metálica', variacoes: [
        { id: 11001, tamanho: '35', material: 'PP + Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 2, categoria: 'Lacres Metálicos',
    produtos: [
      { id: 201, nome: 'Lacre Metálico Colorido', variacoes: [
        { id: 20101, tamanho: 'Único', material: 'Aço', cor: 'Amarelo',  precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 20102, tamanho: 'Único', material: 'Aço', cor: 'Azul',     precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 20103, tamanho: 'Único', material: 'Aço', cor: 'Vermelho', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 202, nome: 'Lacre Chumbo Sinete', variacoes: [
        { id: 20201, tamanho: 'Único', material: 'Chumbo', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 203, nome: 'Lacre Sextavado', variacoes: [
        { id: 20301, tamanho: 'Único', material: 'Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 204, nome: 'Pino Bolt Seal', variacoes: [
        { id: 20401, tamanho: 'Único', material: 'Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 205, nome: 'Zlock 3 Folha Flandres', variacoes: [
        { id: 20501, tamanho: 'Único', material: 'Flandres', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 206, nome: 'Zlock Manivela', variacoes: [
        { id: 20601, tamanho: 'Único', material: 'Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 3, categoria: 'Cadeados',
    produtos: [
      { id: 301, nome: 'Cadeado Tradicional Latão', variacoes: [
        { id: 30101, tamanho: '20mm', material: 'Latão', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 30102, tamanho: '25mm', material: 'Latão', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 30103, tamanho: '30mm', material: 'Latão', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 30104, tamanho: '40mm', material: 'Latão', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 30105, tamanho: '50mm', material: 'Latão', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 30106, tamanho: '60mm', material: 'Latão', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 302, nome: 'Cadeado Tetra', variacoes: [
        { id: 30201, tamanho: '30mm', material: 'Liga metálica', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 303, nome: 'Cadeado Haste Longa', variacoes: [
        { id: 30301, tamanho: '35mm', material: 'Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 304, nome: 'Cadeado Colorido', variacoes: [
        { id: 30401, tamanho: 'Único', material: 'Liga', cor: 'Diversas', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 305, nome: 'Cadeado Bloqueio', variacoes: [
        { id: 30501, tamanho: 'Único', material: 'Nylon + Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 306, nome: 'Cadeado Segredo Numérico', variacoes: [
        { id: 30601, tamanho: '25mm', material: 'Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 4, categoria: 'Abraçadeiras',
    produtos: [
      { id: 401, nome: 'Abraçadeira de Nylon Padrão', variacoes: [
        { id: 40101, tamanho: '100mm', material: 'Nylon', cor: 'Branca', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40102, tamanho: '150mm', material: 'Nylon', cor: 'Branca', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40103, tamanho: '200mm', material: 'Nylon', cor: 'Branca', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40104, tamanho: '300mm', material: 'Nylon', cor: 'Branca', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40105, tamanho: '100mm', material: 'Nylon', cor: 'Preta',  precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40106, tamanho: '150mm', material: 'Nylon', cor: 'Preta',  precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40107, tamanho: '200mm', material: 'Nylon', cor: 'Preta',  precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 40108, tamanho: '300mm', material: 'Nylon', cor: 'Preta',  precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 402, nome: 'Abraçadeira Identificável', variacoes: [
        { id: 40201, tamanho: 'Único', material: 'Nylon', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 403, nome: 'Abraçadeira Metálica', variacoes: [
        { id: 40301, tamanho: 'Único', material: 'Aço', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 5, categoria: 'Fitas',
    produtos: [
      { id: 501, nome: 'Fita Adesiva', variacoes: [
        { id: 50101, tamanho: '45x100m', material: 'BOPP', cor: 'Transparente', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 50102, tamanho: '48x100m', material: 'BOPP', cor: 'Marrom',       precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 50103, tamanho: '48x100m', material: 'BOPP', cor: 'Branca',       precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 502, nome: 'Fita Crepe', variacoes: [
        { id: 50201, tamanho: 'Fina',   material: 'Papel', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 50202, tamanho: 'Média',  material: 'Papel', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 50203, tamanho: 'Grossa', material: 'Papel', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 503, nome: 'Fita Isolante', variacoes: [
        { id: 50301, tamanho: '5m',  material: 'PVC', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 50302, tamanho: '10m', material: 'PVC', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 504, nome: 'Fita Dupla Face', variacoes: [
        { id: 50401, tamanho: 'Único', material: '', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 505, nome: 'Fita Silver Tape', variacoes: [
        { id: 50501, tamanho: 'Único', material: 'PE', cor: 'Prata', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 506, nome: 'Fita para Máquina Lacradora', variacoes: [
        { id: 50601, tamanho: 'Único', material: 'PP', cor: 'Azul',     precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 50602, tamanho: 'Único', material: 'PP', cor: 'Vermelho', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 6, categoria: 'Malotes e Pastas',
    produtos: [
      { id: 601, nome: 'Malote Correio', variacoes: [
        { id: 60101, tamanho: '30x25x10', material: 'Courino', cor: 'Marrom', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60102, tamanho: '56x36x10', material: 'Courino', cor: 'Azul',   precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 602, nome: 'Malote Lona', variacoes: [
        { id: 60201, tamanho: '52x34x17', material: 'Lona', cor: 'Laranja', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 603, nome: 'Pasta Emborrachada', variacoes: [
        { id: 60301, tamanho: '30x40', material: 'Emborrachada', cor: 'Azul', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 604, nome: 'Pasta Lona', variacoes: [
        { id: 60401, tamanho: '30x40',  material: 'Lona', cor: '',      precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60402, tamanho: '40x35',  material: 'Lona', cor: 'Verde', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60403, tamanho: '34x27',  material: 'Lona', cor: 'Verde', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60404, tamanho: '21x36',  material: 'Lona', cor: 'Preto', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 605, nome: 'Pasta Nylon', variacoes: [
        { id: 60501, tamanho: '30x40',   material: 'Nylon', cor: '',         precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60502, tamanho: '29x39',   material: 'Nylon', cor: 'Cinza',    precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60503, tamanho: '28x40',   material: 'Nylon', cor: 'Verde',    precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60504, tamanho: '40x35x8', material: 'Nylon', cor: '',         precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60505, tamanho: '46x41x8', material: 'Nylon', cor: 'Vermelho', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 60506, tamanho: '35x30',   material: 'Nylon', cor: 'Azul',     precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 7, categoria: 'Arames e Fitilhos',
    produtos: [
      { id: 701, nome: 'Amarrilho — Twist Ties', variacoes: [
        { id: 70101, tamanho: 'Único', material: 'Papel/Arame', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 702, nome: 'Arame Galvanizado para Lacres', variacoes: [
        { id: 70201, tamanho: '2 fios', material: 'Aço Galvanizado', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 70202, tamanho: '3 fios', material: 'Aço Galvanizado', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 703, nome: 'Fitilho Plástico', variacoes: [
        { id: 70301, tamanho: 'Único', material: 'PP', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
  {
    id: 8, categoria: 'Máquinas',
    produtos: [
      { id: 801, nome: 'Máquina Lacradora', variacoes: [
        { id: 80101, tamanho: 'Quadrada', material: '', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
        { id: 80102, tamanho: 'Redonda',  material: '', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
      { id: 802, nome: 'Máquina Seladora', variacoes: [
        { id: 80201, tamanho: 'Único', material: '', cor: '', precoAtacado: null, precoVarejo: null, precoMilheiro: null, precoUnidade: null, prazo: '', obs: '' },
      ]},
    ],
  },
];

function initCatalogo() {
  const ver = localStorage.getItem(CAT_VER_KEY);
  if (ver !== CAT_VERSION) {
    localStorage.setItem(CAT_KEY, JSON.stringify(CATALOGO_SEED));
    localStorage.setItem(CAT_VER_KEY, CAT_VERSION);
    return CATALOGO_SEED;
  }
  try {
    const raw = localStorage.getItem(CAT_KEY);
    return raw ? JSON.parse(raw) : CATALOGO_SEED;
  } catch { return CATALOGO_SEED; }
}

function saveCatalogo(data) {
  localStorage.setItem(CAT_KEY, JSON.stringify(data));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function brl(val) {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return isNaN(n) ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1;
}

const CAMPOS_PRECO = [
  { key: 'precoAtacado',  label: 'Atacado',   color: 'text-emerald-700' },
  { key: 'precoVarejo',   label: 'Varejo',    color: 'text-blue-700'    },
  { key: 'precoMilheiro', label: '/Milheiro', color: 'text-purple-700'  },
  { key: 'precoUnidade',  label: '/Unidade',  color: 'text-orange-700'  },
];

const VAZIO_VAR = { tamanho: '', material: '', cor: '', precoAtacado: '', precoVarejo: '', precoMilheiro: '', precoUnidade: '', prazo: '', obs: '' };

// ── Modal genérico ─────────────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><LucideX className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Precos() {
  const { can } = useAuth();
  const isAdmin = !!can.editarPrecos;

  const [catalogo, setCatalogo]   = useState(initCatalogo);

  // Expansão — default aberto
  const [expandedCats, setExpandedCats]   = useState({});
  const [expandedProds, setExpandedProds] = useState({});

  const [busca, setBusca]         = useState('');
  const [filtroCat, setFiltroCat] = useState('');

  // Estado dos modais
  const [modalCat, setModalCat]   = useState(false);   // nova categoria
  const [editCat, setEditCat]     = useState(null);    // {id, categoria}
  const [modalProd, setModalProd] = useState(null);    // catId para novo produto
  const [editProd, setEditProd]   = useState(null);    // {catId, id, nome}
  const [modalVar, setModalVar]   = useState(null);    // {catId, prodId}
  const [editVar, setEditVar]     = useState(null);    // {catId, prodId, varId}
  const [confirmDel, setConfirmDel] = useState(null);

  const [formCat,  setFormCat]  = useState('');
  const [formProd, setFormProd] = useState('');
  const [formVar,  setFormVar]  = useState(VAZIO_VAR);

  // ── Save helper ──────────────────────────────────────────────────────────
  const save = useCallback(novo => {
    setCatalogo(novo);
    saveCatalogo(novo);
  }, []);

  // ── Filtro ──────────────────────────────────────────────────────────────
  const resultado = useMemo(() => {
    return catalogo
      .filter(c => !filtroCat || c.id === Number(filtroCat))
      .map(c => ({
        ...c,
        produtos: c.produtos.filter(p =>
          !busca ||
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          p.variacoes.some(v =>
            (v.tamanho  || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.material || '').toLowerCase().includes(busca.toLowerCase()) ||
            (v.cor      || '').toLowerCase().includes(busca.toLowerCase())
          )
        ),
      }))
      .filter(c => c.produtos.length > 0);
  }, [catalogo, busca, filtroCat]);

  // ── Toggles ──────────────────────────────────────────────────────────────
  function toggleCat(id) { setExpandedCats(e => ({ ...e, [id]: !(e[id] !== false) })); }
  function toggleProd(id) { setExpandedProds(e => ({ ...e, [id]: !(e[id] !== false) })); }

  // ── CRUD Categoria ───────────────────────────────────────────────────────
  function adicionarCategoria() {
    if (!formCat.trim()) return;
    save([...catalogo, { id: nextId(catalogo), categoria: formCat.trim(), produtos: [] }]);
    setFormCat(''); setModalCat(false);
  }
  function salvarCategoria() {
    if (!formCat.trim()) return;
    save(catalogo.map(c => c.id === editCat.id ? { ...c, categoria: formCat.trim() } : c));
    setEditCat(null); setFormCat('');
  }

  // ── CRUD Produto ─────────────────────────────────────────────────────────
  function adicionarProduto(catId) {
    if (!formProd.trim()) return;
    save(catalogo.map(c => c.id !== catId ? c : { ...c, produtos: [...c.produtos, { id: nextId(c.produtos), nome: formProd.trim(), variacoes: [] }] }));
    setFormProd(''); setModalProd(null);
  }
  function salvarProduto() {
    if (!formProd.trim()) return;
    save(catalogo.map(c => c.id !== editProd.catId ? c : { ...c, produtos: c.produtos.map(p => p.id !== editProd.id ? p : { ...p, nome: formProd.trim() }) }));
    setEditProd(null); setFormProd('');
  }

  // ── CRUD Variação ────────────────────────────────────────────────────────
  function parsePrecos(fv) {
    return {
      tamanho:      fv.tamanho,
      material:     fv.material,
      cor:          fv.cor,
      precoAtacado:  fv.precoAtacado  !== '' ? Number(String(fv.precoAtacado).replace(',', '.'))  : null,
      precoVarejo:   fv.precoVarejo   !== '' ? Number(String(fv.precoVarejo).replace(',', '.'))   : null,
      precoMilheiro: fv.precoMilheiro !== '' ? Number(String(fv.precoMilheiro).replace(',', '.')) : null,
      precoUnidade:  fv.precoUnidade  !== '' ? Number(String(fv.precoUnidade).replace(',', '.'))  : null,
      prazo:        fv.prazo,
      obs:          fv.obs,
    };
  }

  function adicionarVariacao(catId, prodId) {
    save(catalogo.map(c => c.id !== catId ? c : {
      ...c,
      produtos: c.produtos.map(p => p.id !== prodId ? p : {
        ...p,
        variacoes: [...p.variacoes, { id: nextId(p.variacoes), ...parsePrecos(formVar) }],
      }),
    }));
    setFormVar(VAZIO_VAR); setModalVar(null);
  }

  function salvarVariacao() {
    const { catId, prodId, varId } = editVar;
    save(catalogo.map(c => c.id !== catId ? c : {
      ...c,
      produtos: c.produtos.map(p => p.id !== prodId ? p : {
        ...p,
        variacoes: p.variacoes.map(v => v.id !== varId ? v : { ...v, ...parsePrecos(formVar) }),
      }),
    }));
    setEditVar(null); setFormVar(VAZIO_VAR);
  }

  function deletarConfirmado() {
    const { tipo, catId, prodId, varId } = confirmDel;
    if (tipo === 'categoria') {
      save(catalogo.filter(c => c.id !== catId));
    } else if (tipo === 'produto') {
      save(catalogo.map(c => c.id !== catId ? c : { ...c, produtos: c.produtos.filter(p => p.id !== prodId) }));
    } else {
      save(catalogo.map(c => c.id !== catId ? c : {
        ...c,
        produtos: c.produtos.map(p => p.id !== prodId ? p : { ...p, variacoes: p.variacoes.filter(v => v.id !== varId) }),
      }));
    }
    setConfirmDel(null);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalVar = useMemo(() => catalogo.reduce((acc, c) => acc + c.produtos.reduce((a, p) => a + p.variacoes.length, 0), 0), [catalogo]);
  const comPreco = useMemo(() => catalogo.reduce((acc, c) => acc + c.produtos.reduce((a, p) => a + p.variacoes.filter(v => v.precoAtacado != null || v.precoVarejo != null).length, 0), 0), [catalogo]);

  // ── Sub-formulário de variação ────────────────────────────────────────────
  function FormVar({ onSubmit, onCancel, labelBotao = 'Salvar' }) {
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[['tamanho','Tamanho','16, 30mm…'],['material','Material','PP, Nylon…'],['cor','Cor','Branca…']].map(([k,l,p]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-gray-600 uppercase">{l}</label>
              <input className="mt-1 border rounded-lg px-3 py-2 w-full text-sm" placeholder={p}
                value={formVar[k]} onChange={e => setFormVar(f => ({...f, [k]: e.target.value}))} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CAMPOS_PRECO.map(c => (
            <div key={c.key}>
              <label className="text-xs font-semibold text-gray-600 uppercase">{c.label}</label>
              <div className="mt-1 flex items-center border rounded-lg overflow-hidden">
                <span className="px-2 text-xs text-gray-400 bg-gray-50 border-r flex items-center py-2">R$</span>
                <input type="number" min="0" step="0.01" className="px-2 py-2 w-full text-sm focus:outline-none" placeholder="0,00"
                  value={formVar[c.key]} onChange={e => setFormVar(f => ({...f, [c.key]: e.target.value}))} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[['prazo','Prazo','10-15 dias'],['obs','Observações','Notas…']].map(([k,l,p]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-gray-600 uppercase">{l}</label>
              <input className="mt-1 border rounded-lg px-3 py-2 w-full text-sm" placeholder={p}
                value={formVar[k]} onChange={e => setFormVar(f => ({...f, [k]: e.target.value}))} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm">{labelBotao}</button>
        </div>
      </form>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LucideTag className="w-6 h-6 text-indigo-500" /> Tabela de Preços
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {catalogo.length} categorias · {totalVar} variações/SKUs · {comPreco} com preço definido
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setFormCat(''); setModalCat(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition text-sm">
            <LucidePlus className="w-4 h-4" /> Nova Categoria
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-600 flex items-center gap-2">
          <LucideInfo className="w-4 h-4 flex-shrink-0" />
          Catálogo comercial — somente visualização. Para atualizar preços, contate o administrador.
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative">
          <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="border rounded-lg pl-9 pr-3 py-2 text-sm w-64"
            placeholder="Buscar produto, material, cor, tamanho..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
          <option value="">Todas as categorias</option>
          {catalogo.map(c => <option key={c.id} value={c.id}>{c.categoria}</option>)}
        </select>
        {(busca || filtroCat) && (
          <button onClick={() => { setBusca(''); setFiltroCat(''); }}
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg border border-gray-200 hover:border-red-300 transition">
            Limpar
          </button>
        )}
      </div>

      {/* Catálogo */}
      <div className="space-y-3">
        {resultado.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 font-semibold">Nenhum resultado</p>
          </div>
        )}

        {resultado.map(cat => {
          const catAberta = expandedCats[cat.id] !== false;
          return (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              {/* ── Header Categoria ── */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100 cursor-pointer select-none"
                onClick={() => toggleCat(cat.id)}>
                <div className="flex items-center gap-2.5">
                  {catAberta ? <LucideChevronDown className="w-4 h-4 text-indigo-500" /> : <LucideChevronRight className="w-4 h-4 text-indigo-500" />}
                  <span className="font-bold text-indigo-800 text-sm tracking-wide uppercase">{cat.categoria}</span>
                  <span className="text-xs text-indigo-400 bg-indigo-100 rounded-full px-2 py-0.5 font-semibold">
                    {cat.produtos.length} produto{cat.produtos.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button title="Novo produto" onClick={() => { setFormProd(''); setModalProd(cat.id); }}
                      className="p-1.5 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition"><LucidePlus className="w-4 h-4" /></button>
                    <button title="Editar categoria" onClick={() => { setEditCat(cat); setFormCat(cat.categoria); }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"><LucidePencil className="w-4 h-4" /></button>
                    <button title="Excluir categoria" onClick={() => setConfirmDel({ tipo: 'categoria', catId: cat.id, nome: cat.categoria })}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><LucideTrash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              {/* ── Produtos ── */}
              {catAberta && (
                <div className="divide-y divide-gray-50">
                  {cat.produtos.length === 0 && (
                    <div className="px-8 py-4 text-sm text-gray-400 italic">
                      {isAdmin ? 'Nenhum produto. Use + para adicionar.' : 'Nenhum produto nesta categoria.'}
                    </div>
                  )}
                  {cat.produtos.map(prod => {
                    const prodAberto = expandedProds[prod.id] !== false;
                    return (
                      <div key={prod.id}>
                        {/* Header Produto */}
                        <div className="flex items-center justify-between px-6 py-2.5 bg-gray-50/70 hover:bg-indigo-50/30 cursor-pointer transition"
                          onClick={() => toggleProd(prod.id)}>
                          <div className="flex items-center gap-2">
                            {prodAberto ? <LucideChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <LucideChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                            <LucidePackage className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-semibold text-gray-700 text-sm">{prod.nome}</span>
                            <span className="text-xs text-gray-400 ml-1">
                              ({prod.variacoes.length} variação{prod.variacoes.length !== 1 ? 'ões' : ''})
                            </span>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <button title="Nova variação"
                                onClick={() => { setFormVar(VAZIO_VAR); setModalVar({ catId: cat.id, prodId: prod.id }); }}
                                className="p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded transition"><LucidePlus className="w-3.5 h-3.5" /></button>
                              <button title="Editar produto"
                                onClick={() => { setEditProd({ catId: cat.id, id: prod.id }); setFormProd(prod.nome); }}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"><LucidePencil className="w-3.5 h-3.5" /></button>
                              <button title="Excluir produto"
                                onClick={() => setConfirmDel({ tipo: 'produto', catId: cat.id, prodId: prod.id, nome: prod.nome })}
                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"><LucideTrash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>

                        {/* Tabela de variações */}
                        {prodAberto && prod.variacoes.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-100 text-gray-500 uppercase tracking-wide text-[11px]">
                                  <th className="px-5 py-2 text-left">Tamanho</th>
                                  <th className="px-3 py-2 text-left">Material</th>
                                  <th className="px-3 py-2 text-left">Cor</th>
                                  {CAMPOS_PRECO.map(c => (
                                    <th key={c.key} className={`px-3 py-2 text-right ${c.color}`}>{c.label}</th>
                                  ))}
                                  <th className="px-3 py-2 text-left">Prazo</th>
                                  <th className="px-3 py-2 text-left">Obs</th>
                                  {isAdmin && <th className="px-3 py-2 text-center">Ações</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {prod.variacoes.map((v, vi) => (
                                  <tr key={v.id} className={`border-t transition ${vi % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-indigo-50/20`}>
                                    <td className="px-5 py-2 font-semibold text-gray-800">{v.tamanho || '—'}</td>
                                    <td className="px-3 py-2 text-gray-500">{v.material || '—'}</td>
                                    <td className="px-3 py-2 text-gray-500">{v.cor || '—'}</td>
                                    {CAMPOS_PRECO.map(c => (
                                      <td key={c.key} className={`px-3 py-2 text-right font-semibold ${c.color}`}>{brl(v[c.key])}</td>
                                    ))}
                                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{v.prazo || '—'}</td>
                                    <td className="px-3 py-2 text-gray-400 max-w-[110px] truncate" title={v.obs || ''}>{v.obs || '—'}</td>
                                    {isAdmin && (
                                      <td className="px-3 py-2 text-center whitespace-nowrap">
                                        <button
                                          onClick={() => {
                                            setFormVar({
                                              tamanho:      v.tamanho      || '',
                                              material:     v.material     || '',
                                              cor:          v.cor          || '',
                                              precoAtacado:  v.precoAtacado  != null ? String(v.precoAtacado)  : '',
                                              precoVarejo:   v.precoVarejo   != null ? String(v.precoVarejo)   : '',
                                              precoMilheiro: v.precoMilheiro != null ? String(v.precoMilheiro) : '',
                                              precoUnidade:  v.precoUnidade  != null ? String(v.precoUnidade)  : '',
                                              prazo:        v.prazo        || '',
                                              obs:          v.obs          || '',
                                            });
                                            setEditVar({ catId: cat.id, prodId: prod.id, varId: v.id });
                                          }}
                                          className="text-indigo-500 hover:text-indigo-700 p-1 rounded transition mr-1 inline-flex">
                                          <LucidePencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setConfirmDel({ tipo: 'variacao', catId: cat.id, prodId: prod.id, varId: v.id, nome: `${prod.nome} ${v.tamanho}` })}
                                          className="text-gray-300 hover:text-red-500 p-1 rounded transition inline-flex">
                                          <LucideTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {prodAberto && prod.variacoes.length === 0 && (
                          <div className="px-10 py-3 text-xs text-gray-400 italic">
                            {isAdmin ? 'Nenhuma variação. Use + para adicionar.' : 'Nenhuma variação cadastrada.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modais ──────────────────────────────────────────────────────────── */}

      {/* Nova / Editar Categoria */}
      {(modalCat || editCat) && (
        <Modal titulo={editCat ? 'Editar Categoria' : 'Nova Categoria'}
          onClose={() => { setModalCat(false); setEditCat(null); setFormCat(''); }}>
          <form onSubmit={e => { e.preventDefault(); editCat ? salvarCategoria() : adicionarCategoria(); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome *</label>
              <input required autoFocus className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                placeholder="Ex: Lacres Plásticos" value={formCat} onChange={e => setFormCat(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setModalCat(false); setEditCat(null); setFormCat(''); }}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Novo / Editar Produto */}
      {(modalProd !== null || editProd) && (
        <Modal titulo={editProd ? 'Editar Produto' : 'Novo Produto'}
          onClose={() => { setModalProd(null); setEditProd(null); setFormProd(''); }}>
          <form onSubmit={e => { e.preventDefault(); editProd ? salvarProduto() : adicionarProduto(modalProd); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do produto *</label>
              <input required autoFocus className="mt-1 border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                placeholder="Ex: Dupla Trava" value={formProd} onChange={e => setFormProd(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setModalProd(null); setEditProd(null); setFormProd(''); }}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-sm">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Nova Variação */}
      {modalVar && (
        <Modal titulo="Nova Variação / SKU" onClose={() => setModalVar(null)}>
          <FormVar onSubmit={() => adicionarVariacao(modalVar.catId, modalVar.prodId)} onCancel={() => setModalVar(null)} labelBotao="Adicionar" />
        </Modal>
      )}

      {/* Editar Variação */}
      {editVar && (
        <Modal titulo="Editar Variação / SKU" onClose={() => setEditVar(null)}>
          <FormVar onSubmit={salvarVariacao} onCancel={() => setEditVar(null)} labelBotao="Salvar" />
        </Modal>
      )}

      {/* Confirmar exclusão */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir {confirmDel.tipo}?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>"{confirmDel.nome}"</strong> será removido permanentemente.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDel(null)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
              <button onClick={deletarConfirmado}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 text-sm shadow">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
