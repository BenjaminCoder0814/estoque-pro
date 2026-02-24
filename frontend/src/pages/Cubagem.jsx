// Cubagem.jsx — Tabela de uso de embalagens (Pacotes e Caixas)
// Dados extraídos do documento oficial de cubagem da Zenith.
// Calculadora: informe tipo de produto, modelo e quantidade → recomendação automática.

import React, { useState, useMemo } from 'react';
import {
  LucidePackage, LucideBox, LucideCalculator, LucideChevronDown,
  LucideChevronUp, LucideAlertTriangle, LucideInfo, LucideCheckCircle2,
  LucideSearch,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DE CUBAGEM
// ─────────────────────────────────────────────────────────────────────────────

// Modelos de lacres plásticos e seus tamanhos disponíveis
const MODELOS_PLASTICO = [
  { id: 'EP', label: 'EP (Espinha de Peixe)', tamanhos: [16, 23, 28] },
  { id: 'ES', label: 'ES (Escada Alta)',       tamanhos: [16, 23, 28] },
  { id: 'DT', label: 'DT (Dupla Trava)',       tamanhos: [16, 23, 28, 31, 36, 41, 50, 55] },
];

const MODELOS_METALICO = [
  { id: 'ZLOCK',   label: 'ZLOCK',            tamanhos: [15, 20, 25, 30, 40] },
  { id: 'ZAJUSTE', label: 'ZAJUSTE (ZAJUSTE)', tamanhos: [15, 20, 25, 30, 40] },
  { id: 'NYLON_ZLOCK',   label: 'ZLOCK — Fio de Nylon',   tamanhos: [30] },
  { id: 'NYLON_ZAJUSTE', label: 'ZAJUSTE — Fio de Nylon', tamanhos: [30] },
];

// ── PACOTES ───────────────────────────────────────────────────────────────────
// Cada embalagem tem uma lista de regras. Uma regra é compatível se:
//   - material coincidir
//   - modelo coincidir (ou for livre)
//   - tamanho estiver na lista
//   - quantidade <= maxPecas
// A função calcular filtrará as regras que atendem e retornará as embalagens.

const DADOS_PACOTES = [
  {
    id: 'pacotinho',
    nome: 'Pacotinho',
    dimensoes: '40 × 30 × 0,10 cm',
    cor: 'indigo',
    regras: [
      {
        material: 'plastico',
        modelos: ['EP', 'ES', 'DT'],
        tamanhos: [16, 23, 28],   // excecao DT31,41,50,55
        maxPecas: 100,
        obs: 'Qualquer tamanho, exceto DT 31, 41, 50 e 55',
      },
      {
        material: 'metalico',
        modelos: ['ZLOCK','ZAJUSTE','NYLON_ZLOCK','NYLON_ZAJUSTE'],
        tamanhos: [15, 20, 25, 30],  // máximo 30cm
        maxPecas: 100,
        obs: 'Até 100 peças de no máximo 30 cm',
      },
    ],
  },
  {
    id: 'pacote',
    nome: 'Pacote',
    dimensoes: '60 × 57 × 0,25 cm',
    cor: 'blue',
    regras: [
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [15], maxPecas: 1000, pesoKg: 15 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [20], maxPecas: 1000, pesoKg: 16 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [25], maxPecas: 1000, pesoKg: 17 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [30], maxPecas: 1000, pesoKg: 18 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [40], maxPecas: 1000, pesoKg: 19 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [15], maxPecas: 1000, pesoKg: 14 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [20], maxPecas: 1000, pesoKg: 16 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [25], maxPecas: 1000, pesoKg: 18 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [30], maxPecas: 1000, pesoKg: 20 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [40], maxPecas: 1000, pesoKg: 22 },
      { material: 'metalico', modelos: ['NYLON_ZLOCK'],   tamanhos: [30], maxPecas: 1000, pesoKg: 14 },
      { material: 'metalico', modelos: ['NYLON_ZAJUSTE'], tamanhos: [30], maxPecas: 1000, pesoKg: 16 },
      { material: 'plastico', modelos: ['EP','ES','DT'], tamanhos: [16, 23], maxPecas: 2000, pesoKg: 4 },
    ],
  },
  {
    id: 'festiva_pac',
    nome: 'Festiva',
    dimensoes: '66 × 78 × 0,25 cm',
    cor: 'purple',
    regras: [
      { material: 'plastico', modelos: ['ES'],      tamanhos: [23], maxPecas: 5000, pesoKg: 8 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [23], maxPecas: 4000, pesoKg: 8 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [16], maxPecas: 6000, pesoKg: 10 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [23], maxPecas: 5000, pesoKg: 7 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [16], maxPecas: 6000, pesoKg: 8 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [28], maxPecas: 3000, pesoKg: 8 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [31], maxPecas: 2000, pesoKg: 10 },
    ],
  },
  {
    id: 'box_pac',
    nome: 'Box',
    dimensoes: '120 × 66 × 0,25 cm',
    cor: 'emerald',
    regras: [
      { material: 'plastico', modelos: ['ES'],       tamanhos: [23], maxPecas: 10000, pesoKg: 16 },
      { material: 'plastico', modelos: ['DT'],       tamanhos: [23], maxPecas: 10000, pesoKg: 18 },
      { material: 'plastico', modelos: ['ES','DT'],  tamanhos: [16], maxPecas: 10000, pesoKg: 16 },
      { material: 'plastico', modelos: ['EP'],       tamanhos: [23], maxPecas: 10000, pesoKg: 16 },
      { material: 'plastico', modelos: ['EP'],       tamanhos: [16], maxPecas: 12000, pesoKg: 16 },
      { material: 'plastico', modelos: ['ES','DT'],  tamanhos: [28], maxPecas: 7000,  pesoKg: 18 },
      { material: 'plastico', modelos: ['DT'],       tamanhos: [31], maxPecas: 3500,  pesoKg: 18 },
    ],
  },
  {
    id: 'duplo_box',
    nome: 'Duplo Box',
    dimensoes: '140 × 76 × 0,25 cm',
    cor: 'amber',
    regras: [
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [16], maxPecas: 12000, pesoKg: 16 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [16], maxPecas: 12000, pesoKg: 16 },
      { material: 'plastico', modelos: ['ES'],      tamanhos: [23], maxPecas: 10000, pesoKg: 16 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [23], maxPecas: 10000, pesoKg: 18 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [23], maxPecas: 10000, pesoKg: 16 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [28], maxPecas: 7000,  pesoKg: 18 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [31], maxPecas: 5000,  pesoKg: 20 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [36], maxPecas: 5000,  pesoKg: 22 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [41], maxPecas: 5000,  pesoKg: 25 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [50], maxPecas: 2500,  pesoKg: 18 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [55], maxPecas: 2500,  pesoKg: 18 },
    ],
  },
  {
    id: 'global_pac',
    nome: 'Global',
    dimensoes: '110 × 95 × 0,30 cm',
    cor: 'rose',
    regras: [
      { material: 'plastico', modelos: ['DT'], tamanhos: [31], maxPecas: 5000,  pesoKg: 20 },
      { material: 'plastico', modelos: ['DT'], tamanhos: [36], maxPecas: 5000,  pesoKg: 22 },
      { material: 'plastico', modelos: ['DT'], tamanhos: [41], maxPecas: 5000,  pesoKg: 25 },
      { material: 'plastico', modelos: ['DT'], tamanhos: [50], maxPecas: 3500,  pesoKg: 18 },
      { material: 'plastico', modelos: ['DT'], tamanhos: [55], maxPecas: 3000,  pesoKg: 18 },
    ],
  },
];

// ── CAIXAS ────────────────────────────────────────────────────────────────────
const DADOS_CAIXAS = [
  {
    id: 'caixa_pequena',
    nome: 'Pequena',
    dimensoes: '26 × 18 × 16 cm',
    cor: 'indigo',
    regras: [
      {
        material: 'plastico',
        modelos: ['EP','ES','DT'],
        tamanhos: [16, 23, 28],
        maxPecas: 100,
        obs: 'Qualquer tamanho, exceto DT 31, 41, 50 e 55',
      },
      {
        material: 'metalico',
        modelos: ['ZLOCK','ZAJUSTE','NYLON_ZLOCK','NYLON_ZAJUSTE'],
        tamanhos: [15, 20, 25, 30],
        maxPecas: 100,
        obs: 'Até 100 peças de no máximo 30 cm',
      },
    ],
  },
  {
    id: 'caixa_manivela',
    nome: 'Manivela',
    dimensoes: '37 × 24 × 18 cm',
    cor: 'blue',
    regras: [
      {
        material: 'plastico',
        modelos: ['EP','ES','DT'],
        tamanhos: [16, 23, 28],
        maxPecas: 1000,
        obs: 'Qualquer tamanho, exceto DT 31, 41, 50 e 55',
      },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [15], maxPecas: 500, pesoKg: 6 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [20], maxPecas: 500, pesoKg: 7 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [25], maxPecas: 500, pesoKg: 8 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [30], maxPecas: 500, pesoKg: 9 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [40], maxPecas: 500, pesoKg: 10 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [15], maxPecas: 500, pesoKg: 7 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [20], maxPecas: 500, pesoKg: 8 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [25], maxPecas: 500, pesoKg: 9 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [30], maxPecas: 500, pesoKg: 10 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [40], maxPecas: 500, pesoKg: 11 },
    ],
  },
  {
    id: 'caixa_festiva',
    nome: 'Festiva',
    dimensoes: '37 × 28 × 30 cm',
    cor: 'purple',
    regras: [
      { material: 'plastico', modelos: ['ES'],      tamanhos: [23], maxPecas: 2000, pesoKg: 4 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [23], maxPecas: 2000, pesoKg: 4 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [16], maxPecas: 3000, pesoKg: 4 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [23], maxPecas: 2000, pesoKg: 4 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [16], maxPecas: 3000, pesoKg: 3 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [28], maxPecas: 2000, pesoKg: 8 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [31], maxPecas: 1000, pesoKg: 10 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [15], maxPecas: 1000, pesoKg: 15 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [20], maxPecas: 1000, pesoKg: 16 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [25], maxPecas: 1000, pesoKg: 17 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [30], maxPecas: 1000, pesoKg: 18 },
      { material: 'metalico', modelos: ['ZLOCK'],   tamanhos: [40], maxPecas: 1000, pesoKg: 19 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [15], maxPecas: 1000, pesoKg: 14 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [20], maxPecas: 1000, pesoKg: 16 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [25], maxPecas: 1000, pesoKg: 18 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [30], maxPecas: 1000, pesoKg: 20 },
      { material: 'metalico', modelos: ['ZAJUSTE'], tamanhos: [40], maxPecas: 1000, pesoKg: 22 },
      { material: 'metalico', modelos: ['NYLON_ZLOCK'],   tamanhos: [30], maxPecas: 1000, pesoKg: 14 },
      { material: 'metalico', modelos: ['NYLON_ZAJUSTE'], tamanhos: [30], maxPecas: 1000, pesoKg: 16 },
      { material: 'plastico', modelos: ['EP','ES','DT'], tamanhos: [16, 23], maxPecas: 2000, pesoKg: 4 },
    ],
  },
  {
    id: 'caixa_box',
    nome: 'Box',
    dimensoes: '48 × 38 × 41 cm',
    cor: 'emerald',
    regras: [
      { material: 'plastico', modelos: ['ES'],      tamanhos: [23], maxPecas: 5000, pesoKg: 8 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [23], maxPecas: 4000, pesoKg: 8 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [16], maxPecas: 6000, pesoKg: 10 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [23], maxPecas: 5000, pesoKg: 7 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [16], maxPecas: 6000, pesoKg: 8 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [28], maxPecas: 3000, pesoKg: 8 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [31], maxPecas: 2000, pesoKg: 10 },
    ],
  },
  {
    id: 'caixa_global',
    nome: 'Global',
    dimensoes: '68 × 60 × 40 cm',
    cor: 'rose',
    regras: [
      { material: 'plastico', modelos: ['DT'],      tamanhos: [31], maxPecas: 5000,  pesoKg: 20 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [36], maxPecas: 4500,  pesoKg: 20 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [41], maxPecas: 4000,  pesoKg: 25 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [50], maxPecas: 3500,  pesoKg: 18 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [55], maxPecas: 3000,  pesoKg: 18 },
      { material: 'plastico', modelos: ['ES','DT'], tamanhos: [16], maxPecas: 10000, pesoKg: 16 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [16], maxPecas: 12000, pesoKg: 16 },
      { material: 'plastico', modelos: ['ES'],      tamanhos: [23], maxPecas: 10000, pesoKg: 18 },
      { material: 'plastico', modelos: ['DT'],      tamanhos: [23], maxPecas: 10000, pesoKg: 18 },
      { material: 'plastico', modelos: ['EP'],      tamanhos: [23], maxPecas: 10000, pesoKg: 16 },
    ],
  },
];

// ── CORES POR COR KEY ─────────────────────────────────────────────────────────
const COR = {
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  title: 'bg-indigo-600',   badge: 'bg-indigo-100 text-indigo-700',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    title: 'bg-blue-600',     badge: 'bg-blue-100 text-blue-700',      text: 'text-blue-700',    dot: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  title: 'bg-purple-600',   badge: 'bg-purple-100 text-purple-700',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'bg-emerald-600',  badge: 'bg-emerald-100 text-emerald-700',text: 'text-emerald-700', dot: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   title: 'bg-amber-600',    badge: 'bg-amber-100 text-amber-700',    text: 'text-amber-700',   dot: 'bg-amber-500' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    title: 'bg-rose-600',     badge: 'bg-rose-100 text-rose-700',      text: 'text-rose-700',    dot: 'bg-rose-500' },
};

// ── FUNÇÃO DE CÁLCULO ─────────────────────────────────────────────────────────
function calcularEmbalagens(material, modelo, tamanho, quantidade, fonte) {
  if (!material || !modelo || !tamanho || !quantidade) return [];
  const qtd = parseInt(quantidade, 10);
  if (isNaN(qtd) || qtd <= 0) return [];
  const resultados = [];
  for (const emb of fonte) {
    for (const r of emb.regras) {
      if (r.material !== material) continue;
      if (!r.modelos.includes(modelo)) continue;
      if (!r.tamanhos.includes(Number(tamanho))) continue;
      if (qtd <= r.maxPecas) {
        resultados.push({
          embalagemNome: emb.nome,
          embalagemDim:  emb.dimensoes,
          embalagemCor:  emb.cor,
          maxPecas:      r.maxPecas,
          pesoKg:        r.pesoKg || null,
          obs:           r.obs || null,
          qtdEmbalagens: Math.ceil(qtd / r.maxPecas),
        });
        break; // apenas primeira regra compatível por embalagem
      }
    }
  }
  return resultados;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────

function BadgeMaterial({ material }) {
  return material === 'plastico'
    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Plástico</span>
    : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Metálico</span>;
}

function RegraTr({ r, idx }) {
  const isEven = idx % 2 === 0;
  const matLabel = r.material === 'plastico' ? 'Plástico' : 'Metálico';
  return (
    <tr className={isEven ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-3 py-2 text-xs">{r.modelos.join(' / ')}</td>
      <td className="px-3 py-2 text-xs text-center">{r.tamanhos.map(t => `${t}cm`).join(', ')}</td>
      <td className="px-3 py-2 text-xs text-center font-semibold">{r.maxPecas.toLocaleString('pt-BR')}</td>
      <td className="px-3 py-2 text-xs text-center">{r.pesoKg ? `${r.pesoKg} kg` : '—'}</td>
      <td className="px-3 py-2 text-xs text-gray-500 italic">{r.obs || '—'}</td>
    </tr>
  );
}

function CardEmbalagem({ emb, tipo }) {
  const [aberto, setAberto] = useState(false);
  const c = COR[emb.cor];
  const plasticos = emb.regras.filter(r => r.material === 'plastico');
  const metalicos = emb.regras.filter(r => r.material === 'metalico');
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${c.border}`}>
      {/* Header */}
      <div className={`${c.title} px-5 py-3 flex items-center justify-between cursor-pointer`} onClick={() => setAberto(v => !v)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            {tipo === 'pacote'
              ? <LucidePackage className="w-5 h-5 text-white" />
              : <LucideBox className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="text-white font-bold text-base">{emb.nome}</div>
            <div className="text-white/70 text-xs">{emb.dimensoes}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {emb.regras.length} regra{emb.regras.length > 1 ? 's' : ''}
          </span>
          {aberto
            ? <LucideChevronUp className="w-5 h-5 text-white" />
            : <LucideChevronDown className="w-5 h-5 text-white" />}
        </div>
      </div>

      {/* Corpo */}
      {aberto && (
        <div className={`${c.bg} p-4 space-y-4`}>
          {plasticos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Plásticos</span>
                <div className="flex-1 h-px bg-blue-200" />
              </div>
              <div className="overflow-x-auto rounded-xl border border-blue-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="px-3 py-2 text-xs font-semibold text-blue-700">Modelo</th>
                      <th className="px-3 py-2 text-xs font-semibold text-blue-700 text-center">Tamanhos</th>
                      <th className="px-3 py-2 text-xs font-semibold text-blue-700 text-center">Máx. Peças</th>
                      <th className="px-3 py-2 text-xs font-semibold text-blue-700 text-center">Peso Máx.</th>
                      <th className="px-3 py-2 text-xs font-semibold text-blue-700">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plasticos.map((r, i) => <RegraTr key={i} r={r} idx={i} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {metalicos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Metálicos</span>
                <div className="flex-1 h-px bg-orange-200" />
              </div>
              <div className="overflow-x-auto rounded-xl border border-orange-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-orange-100">
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700">Modelo</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 text-center">Tamanhos</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 text-center">Máx. Peças</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 text-center">Peso Máx.</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metalicos.map((r, i) => <RegraTr key={i} r={r} idx={i} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULADORA
// ─────────────────────────────────────────────────────────────────────────────
function Calculadora({ fonteLabel, fonte }) {
  const [material, setMaterial] = useState('');
  const [modelo,   setModelo]   = useState('');
  const [tamanho,  setTamanho]  = useState('');
  const [qtd,      setQtd]      = useState('');
  const [resultado, setResultado] = useState(null);

  const modelos = material === 'plastico' ? MODELOS_PLASTICO : material === 'metalico' ? MODELOS_METALICO : [];
  const tamanhos = useMemo(() => {
    if (!modelo) return [];
    const m = modelos.find(m => m.id === modelo);
    return m ? m.tamanhos : [];
  }, [modelo, modelos]);

  function calcular() {
    const res = calcularEmbalagens(material, modelo, tamanho, qtd, fonte);
    setResultado(res);
  }

  function limpar() {
    setMaterial(''); setModelo(''); setTamanho(''); setQtd(''); setResultado(null);
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
          <LucideCalculator className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-800 text-sm">Calculadora de Embalagem</div>
          <div className="text-xs text-gray-500">Informe os dados e veja qual {fonteLabel.toLowerCase()} usar</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Material */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Material</label>
          <select
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={material}
            onChange={e => { setMaterial(e.target.value); setModelo(''); setTamanho(''); setResultado(null); }}
          >
            <option value="">Selecionar…</option>
            <option value="plastico">Plástico</option>
            <option value="metalico">Metálico</option>
          </select>
        </div>

        {/* Modelo */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Modelo</label>
          <select
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
            value={modelo}
            onChange={e => { setModelo(e.target.value); setTamanho(''); setResultado(null); }}
            disabled={!material}
          >
            <option value="">Selecionar…</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        {/* Tamanho */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Tamanho</label>
          <select
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white disabled:opacity-50"
            value={tamanho}
            onChange={e => { setTamanho(e.target.value); setResultado(null); }}
            disabled={!modelo}
          >
            <option value="">Selecionar…</option>
            {tamanhos.map(t => <option key={t} value={t}>{t} cm</option>)}
          </select>
        </div>

        {/* Quantidade */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantidade</label>
          <input
            type="number"
            min="1"
            placeholder="Ex: 5000"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            value={qtd}
            onChange={e => { setQtd(e.target.value); setResultado(null); }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={calcular}
          disabled={!material || !modelo || !tamanho || !qtd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow"
        >
          <LucideCalculator className="w-4 h-4" />
          Calcular
        </button>
        <button
          onClick={limpar}
          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition"
        >
          Limpar
        </button>
      </div>

      {/* Resultado */}
      {resultado !== null && (
        <div className="border-t border-indigo-200 pt-4">
          {resultado.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <LucideAlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                Nenhuma embalagem comporta <strong>{parseInt(qtd).toLocaleString('pt-BR')}</strong> peças de {' '}
                {modelo} {tamanho}cm. Verifique se é necessário dimensionar manualmente.
              </span>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {resultado.length} embalagem(ns) compatível(is) — ordenado do menor para o maior
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resultado.map((r, i) => {
                  const c = COR[r.embalagemCor];
                  return (
                    <div key={i} className={`rounded-xl border p-3 ${c.bg} ${c.border} ${i === 0 ? 'ring-2 ring-indigo-400' : ''}`}>
                      {i === 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <LucideCheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Recomendado</span>
                        </div>
                      )}
                      <div className={`font-bold text-base ${c.text}`}>{r.embalagemNome}</div>
                      <div className="text-xs text-gray-500 mb-2">{r.embalagemDim}</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Máx. por embalagem</span>
                          <span className={`text-xs font-bold ${c.text}`}>{r.maxPecas.toLocaleString('pt-BR')} pcs</span>
                        </div>
                        {r.pesoKg && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Peso máximo</span>
                            <span className="text-xs font-bold text-gray-700">{r.pesoKg} kg</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-gray-200 pt-1 mt-1">
                          <span className="text-xs text-gray-600">Qtd. necessária</span>
                          <span className="text-xs font-bold text-indigo-600">
                            {r.qtdEmbalagens} {r.qtdEmbalagens === 1 ? 'embalagem' : 'embalagens'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Cubagem() {
  const [tab, setTab] = useState('pacotes'); // 'pacotes' | 'caixas'

  const fonte = tab === 'pacotes' ? DADOS_PACOTES : DADOS_CAIXAS;
  const fonteLabel = tab === 'pacotes' ? 'Pacote' : 'Caixa';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <LucidePackage className="w-7 h-7 text-indigo-600" />
            Cubagem
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tabela oficial de uso de embalagens — Pacotes e Caixas</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('pacotes')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'pacotes' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LucidePackage className="w-4 h-4" /> Pacotes
          </button>
          <button
            onClick={() => setTab('caixas')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'caixas' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LucideBox className="w-4 h-4" /> Caixas
          </button>
        </div>
      </div>

      {/* Calculadora */}
      <Calculadora key={tab} fonteLabel={fonteLabel} fonte={fonte} />

      {/* Tabelas de referência */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
            Tabela de referência — {fonteLabel}s
          </span>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">Clique em uma embalagem para expandir</span>
        </div>

        <div className="space-y-3">
          {fonte.map(emb => (
            <CardEmbalagem key={emb.id} emb={emb} tipo={tab === 'pacotes' ? 'pacote' : 'caixa'} />
          ))}
        </div>
      </div>

      {/* Aviso oficial */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
          <LucideAlertTriangle className="w-4 h-4 flex-shrink-0" />
          Avisos Importantes
        </div>
        <ul className="list-disc list-inside text-sm text-amber-800 space-y-1 pl-1">
          <li><strong>Malotes, Abraçadeiras, ZNAN, Amarrilhos, Lacre Tag, Fitas, Fitilho, Chumbo, Máq. Lacradora, Aplicador Sacola e Cadeados</strong> precisam ser dimensionados na hora, devido à grande variação de quantidades e medidas.</li>
          <li>O peso por embalagem sempre deve ser, no máximo, <strong>30 kg</strong> (exigência dos Correios).</li>
          <li>Atualmente, nenhuma transportadora exige envio em caixa. A maioria dos clientes não tem problema com pacotes, mas alguns podem solicitar (ex: J. Nunes) — a consultora informará nesses casos.</li>
        </ul>
      </div>
    </div>
  );
}
