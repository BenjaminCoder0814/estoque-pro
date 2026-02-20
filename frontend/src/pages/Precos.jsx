// Precos.jsx — Catálogo comercial completo com preços da tabela 12/2025
// ADMIN: edita tudo | SUPERVISAO + COMERCIAL: somente visualização
import React, { useState, useMemo, useCallback } from 'react';
import {
  LucideChevronDown, LucideChevronRight, LucidePlus,
  LucidePencil, LucideTrash2, LucideX,
  LucideSearch, LucideTag, LucidePackage, LucideInfo
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CAT_KEY     = 'zkCatalogo';
const CAT_VERSION = 'v2';
const CAT_VER_KEY = 'zkCatalogoVersion';

// Helpers
function brl(val) {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return isNaN(n) ? String(val) : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1;
}
const v = (id, tamanho, material, cor, precoAtacado, precoVarejo, precoMilheiro, precoUnidade, prazo, obs = '') =>
  ({ id, tamanho, material, cor, precoAtacado, precoVarejo, precoMilheiro, precoUnidade, prazo, obs });

// ── CATÁLOGO COMPLETO ─────────────────────────────────────────────────────
const CATALOGO_SEED = [
  // ════════════════════════════════════════════════════════════════
  // 1. LACRES PLÁSTICOS PP
  // ════════════════════════════════════════════════════════════════
  {
    id: 1, categoria: 'Lacres Plásticos — PP',
    produtos: [
      { id: 101, nome: 'Dupla Trava (DT)', variacoes: [
        v(10101, '16mm', 'PP', '', 95.00,  null, 13.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(10102, '16mm', 'PP', '', 85.00,  null, 12.00, null, '10–15 dias', 'Outra opção (fornecedor alternativo)'),
        v(10103, '16mm', 'PP', '', 89.00,  null, null,  null, '10–15 dias', ''),
        v(10104, '16mm', 'PP', '', 108.00, null, null,  null, '20–30 dias', ''),
        v(10105, '16mm', 'PP', '', 119.00, null, null,  null, '15–20 dias', 'Sem varejo em pacote'),
        v(10106, '23mm', 'PP', '', 139.00, null, null,  null, '20–30 dias', ''),
        v(10107, '25mm', 'PP', '', 238.00, null, null,  null, '10–15 dias', ''),
        v(10108, '31mm', 'PP', '', 204.00, null, 27.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(10109, '36mm', 'PP', '', 239.00, null, 32.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(10110, '41mm', 'PP', '', 279.00, null, 38.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(10111, '45mm', 'PP', '', 339.00, null, 41.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(10112, '50mm', 'PP', '', 379.00, null, 44.00, null, '10–15 dias', 'Somente se tiver em estoque'),
        v(10113, '55mm', 'PP', '', 419.00, null, 49.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
      ]},
      { id: 102, nome: 'Dupla Trava Corte Fácil (DT CF)', variacoes: [
        v(10201, '23mm', 'PP', '', 179.00, null, null, null, '15–20 dias', 'Sem varejo em pacote'),
        v(10202, '27mm', 'PP', '', 259.00, null, null, null, '15–20 dias', 'Sem varejo em pacote'),
        v(10203, '32mm', 'PP', '', 259.00, null, null, null, '15–20 dias', ''),
        v(10204, '35mm', 'PP', '', 269.00, null, null, null, '15–20 dias', ''),
        v(10205, '37mm', 'PP', '', 519.00, null, null, null, '15–20 dias', ''),
      ]},
      { id: 103, nome: 'Escada Alta (ES)', variacoes: [
        v(10301, '23mm', 'PP', '', 115.00, null, 15.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(10302, '23mm', 'PP', '', 119.00, null, null,  null, '10–15 dias', 'Sem varejo em pacote'),
        v(10303, '28mm', 'PP', '', 259.00, null, null,  null, '10–15 dias', 'Sem varejo em pacote'),
        v(10304, '30mm', 'PP', '', 374.00, null, null,  null, '20–30 dias', 'Mínimo 1.000 pçs — Protocolo'),
        v(10305, '35mm', 'PP', '', 349.00, null, null,  null, '20–30 dias', 'Trava Dupla'),
        v(10306, '45mm', 'PP', '', 449.00, null, null,  null, '20–30 dias', 'Trava Dupla'),
      ]},
      { id: 104, nome: 'Espinha de Peixe (EP)', variacoes: [
        v(10401, '23mm', 'PP', '', 125.00, null, null, null, '10–15 dias', 'Atacado: 11 pcts'),
        v(10402, '42mm', 'PP', '', 309.00, null, null, null, '10–15 dias', 'Sem varejo em pacote'),
      ]},
      { id: 105, nome: 'Espinha de Peixe Corte Fácil', variacoes: [
        v(10501, '23mm', 'PP', '', 189.00, null, null, null, '10–20 dias', ''),
      ]},
      { id: 106, nome: 'Trava Única (TU)', variacoes: [
        v(10601, '31mm', 'PP', '', 350.00, null, null, null, '15–20 dias', 'Sem varejo em pacote'),
      ]},
      { id: 107, nome: 'TM Trava Metálica', variacoes: [
        v(10701, '45mm', 'PP', '', 986.00, null, null, null, '20–30 dias', ''),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 2. LACRES PLÁSTICOS NYLON
  // ════════════════════════════════════════════════════════════════
  {
    id: 2, categoria: 'Lacres Plásticos — Nylon',
    produtos: [
      { id: 201, nome: 'Escada Alta Nylon (ES NY)', variacoes: [
        v(20101, '16mm seco',    'Nylon', '', 119.00, null, 18.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(20102, '16mm molhado', 'Nylon', '', 194.00, null, null,  null, '10–15 dias', ''),
        v(20103, '23mm seco',    'Nylon', '', 149.00, null, 21.00, null, '10–15 dias', 'Atacado: 11 pcts / Varejo: 10 pcts'),
        v(20104, '23mm molhado', 'Nylon', '', 239.00, null, null,  null, '10–15 dias', ''),
        v(20105, '28mm molhado', 'Nylon', '', 309.00, null, null,  null, '—',          ''),
        v(20106, '36mm',         'Nylon', '', 884.00, null, null,  null, '25–30 dias', ''),
        v(20107, '40mm',         'NT',    '', 918.00, null, null,  null, '25–30 dias', ''),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 3. LACRE DE SACOLA
  // ════════════════════════════════════════════════════════════════
  {
    id: 3, categoria: 'Lacre de Sacola',
    produtos: [
      { id: 301, nome: 'Lacre de Sacola', variacoes: [
        v(30101, 'Rígido',   'PP', '',  null, null, 45.00,  null, '7–10 dias', ''),
        v(30102, 'Flexível', 'PP', '',  null, null, 49.00,  null, '7–10 dias', ''),
        v(30103, 'GG',       'PP', '',  null, null, 136.00, null, '7–10 dias', ''),
      ]},
      { id: 302, nome: 'Aplicador de Lacre de Sacola', variacoes: [
        v(30201, 'Único', '', '', null, null, null, 25.00, '15–20 dias', 'Prazo gravado: 30–45 dias'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 4. LACRE ANEL / AMPOLA
  // ════════════════════════════════════════════════════════════════
  {
    id: 4, categoria: 'Lacre Anel / Ampola',
    produtos: [
      { id: 401, nome: 'Lacre Anel', variacoes: [
        v(40101, 'M30/M22/CO2', 'PP', '', null, null, 187.00, null, '7–10 dias', ''),
      ]},
      { id: 402, nome: 'Lacre Ampola', variacoes: [
        v(40201, 'Único', 'PP', '', null, null, 221.00, null, '7–10 dias', ''),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 5. LACRE PARA CAIXAS (ALC / MZA)
  // ════════════════════════════════════════════════════════════════
  {
    id: 5, categoria: 'Lacre para Caixas ALC/MZA',
    produtos: [
      { id: 501, nome: 'Lacre MZA para Caixa ALC', variacoes: [
        v(50101, '45x16x21mm', 'PP', 'Liso',         null, null, 170.00, null, '15–20 dias', 'Personalização +R$10/mlr | Numeração +R$10/mlr'),
        v(50102, '45x16x21mm', 'PP', 'Personalizado', null, null, 180.00, null, '30–45 dias', 'Laser'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 6. LACRE ZNAN
  // ════════════════════════════════════════════════════════════════
  {
    id: 6, categoria: 'Lacre Znan',
    produtos: [
      { id: 601, nome: 'Znan sem Rabicho', variacoes: [
        v(60101, 'Único', 'PP', '', null, null, 149.00, null, '15–20 dias', ''),
      ]},
      { id: 602, nome: 'Znan com Rabicho', variacoes: [
        v(60201, 'Único', 'PP', '', null, null, 159.00, null, '15–20 dias', ''),
      ]},
      { id: 603, nome: 'Znan c/ gravação na caneca', variacoes: [
        v(60301, 'Único', 'PP', '', null, null, 285.00, null, '30–40 dias', ''),
      ]},
      { id: 604, nome: 'Znan Policarbonato', variacoes: [
        v(60401, 'Único', 'Policarbonato', '', null, null, 435.00, null, '—', ''),
      ]},
      { id: 605, nome: 'Znan com Arame 2x26', variacoes: [
        v(60501, '20cm', 'PP+Arame', '', null, null, 239.00, null, '20–30 dias', ''),
        v(60502, '25cm', 'PP+Arame', '', null, null, 250.00, null, '20–30 dias', ''),
        v(60503, '30cm', 'PP+Arame', '', null, null, 269.00, null, '20–30 dias', ''),
        v(60504, '35cm', 'PP+Arame', '', null, null, 275.00, null, '20–30 dias', ''),
        v(60505, '40cm', 'PP+Arame', '', null, null, 296.00, null, '20–30 dias', ''),
        v(60506, '45cm', 'PP+Arame', '', null, null, 310.00, null, '20–30 dias', ''),
        v(60507, '50cm', 'PP+Arame', '', null, null, 340.00, null, '20–30 dias', ''),
        v(60508, '55cm', 'PP+Arame', '', null, null, 370.00, null, '20–30 dias', ''),
      ]},
      { id: 606, nome: 'Znan Fita Metálica', variacoes: [
        v(60601, '15cm', 'Fita metálica', '', null, null, 239.00, null, '35–45 dias', 'Consultar disponibilidade'),
        v(60602, '20cm', 'Fita metálica', '', null, null, 252.00, null, '35–45 dias', ''),
        v(60603, '30cm', 'Fita metálica', '', null, null, 315.00, null, '35–45 dias', ''),
        v(60604, '30cm', 'Fita metálica', '', null, null, 354.00, null, '35–45 dias', 'Versão premiada'),
        v(60605, '35cm', 'Fita metálica', '', null, null, 399.00, null, '35–45 dias', ''),
        v(60606, '40cm', 'Fita metálica', '', null, null, 430.00, null, '35–45 dias', ''),
        v(60607, '50cm', 'Fita metálica', '', null, null, 453.00, null, '35–45 dias', ''),
        v(60608, '60cm', 'Fita metálica', '', null, null, 532.00, null, '35–45 dias', ''),
        v(60609, '70cm', 'Fita metálica', '', null, null, 616.00, null, '35–45 dias', ''),
      ]},
      { id: 607, nome: 'Znan c/ Arame 2x26 POLICARBONATO', variacoes: [
        v(60701, '30cm', 'Policarbonato+Arame', '', null, null, 589.00, null, '45–50 dias', ''),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 7. LACRES METÁLICOS
  // ════════════════════════════════════════════════════════════════
  {
    id: 7, categoria: 'Lacres Metálicos',
    produtos: [
      { id: 701, nome: 'Lacre Zpino (Pino Bolt)', variacoes: [
        v(70101, 'Único', 'Aço', 'Amarelo (pronta entrega)', null, null, null, 3.75, '—', 'Somente amarelo em pronta entrega'),
      ]},
      { id: 702, nome: 'Lacre Blindado Ajustável (ZAJUST)', variacoes: [
        v(70201, '30cm', 'Aço galvanizado', '', null, null, null, 1.25, '5–10 dias', 'Cabo 1,5mm'),
        v(70202, '40cm', 'Aço galvanizado', '', null, null, null, 1.32, '5–10 dias', 'Cabo 1,5mm'),
      ]},
      { id: 703, nome: 'Zlock 1 — Aço Galvanizado (ZAJUST)', variacoes: [
        v(70301, '15cm', 'Aço galv.', '', null, null, null, 1.19, '5–10 dias', ''),
        v(70302, '20cm', 'Aço galv.', '', null, null, null, 1.26, '5–10 dias', ''),
        v(70303, '25cm', 'Aço galv.', '', null, null, null, 1.31, '5–10 dias', ''),
        v(70304, '30cm', 'Aço galv.', '', null, null, null, 1.37, '5–10 dias', ''),
        v(70305, '40cm', 'Aço galv.', '', null, null, null, 1.48, '5–10 dias', ''),
        v(70306, '50cm', 'Aço galv.', '', null, null, null, 1.67, '5–10 dias', ''),
        v(70307, '60cm', 'Aço galv.', '', null, null, null, 1.78, '5–10 dias', ''),
        v(70308, '70cm', 'Aço galv.', '', null, null, null, 1.89, '5–10 dias', ''),
        v(70309, '80cm', 'Aço galv.', '', null, null, null, 2.12, '5–10 dias', ''),
        v(70310, '90cm', 'Aço galv.', '', null, null, null, 2.24, '5–10 dias', ''),
        v(70311, '100cm','Aço galv.', '', null, null, null, 2.26, '5–10 dias', ''),
        v(70312, '150cm','Aço galv.', '', null, null, null, 2.36, '5–10 dias', ''),
      ]},
      { id: 704, nome: 'Zlock 1 — Aço Inox (ZAJUST)', variacoes: [
        v(70401, '15cm', 'Aço inox', '', null, null, null, 1.89, '7–15 dias', ''),
        v(70402, '20cm', 'Aço inox', '', null, null, null, 2.09, '7–15 dias', ''),
        v(70403, '30cm', 'Aço inox', '', null, null, null, 2.18, '7–15 dias', ''),
        v(70404, '40cm', 'Aço inox', '', null, null, null, 2.25, '7–15 dias', ''),
        v(70405, '50cm', 'Aço inox', '', null, null, null, 2.34, '7–15 dias', ''),
        v(70406, '60cm', 'Aço inox', '', null, null, null, 2.66, '7–15 dias', ''),
        v(70407, '70cm', 'Aço inox', '', null, null, null, 2.79, '7–15 dias', ''),
        v(70408, '80cm', 'Aço inox', '', null, null, null, 2.92, '7–15 dias', ''),
        v(70409, '90cm', 'Aço inox', '', null, null, null, 3.06, '7–15 dias', ''),
        v(70410, '100cm','Aço inox', '', null, null, null, 3.19, '7–15 dias', ''),
        v(70411, '150cm','Aço inox', '', null, null, null, 3.25, '7–15 dias', ''),
      ]},
      { id: 705, nome: 'Zajust — 15 a 40cm', variacoes: [
        v(70501, '15cm', 'Aço galv.', '', null, null, null, 1.59, '—', ''),
        v(70502, '20cm', 'Aço galv.', '', null, null, null, 1.69, '—', ''),
        v(70503, '30cm', 'Aço galv.', '', null, null, null, 2.12, '—', ''),
        v(70504, '40cm', 'Aço galv.', '', null, null, null, 2.22, '—', ''),
      ]},
      { id: 706, nome: 'Zajust — Aço Inox', variacoes: [
        v(70601, '30cm', 'Aço inox', '', null, null, null, 2.79, '—', ''),
        v(70602, '50cm', 'Aço inox', '', null, null, null, 2.42, '—', ''),
        v(70603, '80cm', 'Aço inox', '', null, null, null, 3.96, '—', ''),
      ]},
      { id: 707, nome: 'Zlock Mini', variacoes: [
        v(70701, '25cm', 'Aço', '', null, null, null, 1.57, '7–15 dias', ''),
        v(70702, '30cm', 'Aço', '', null, null, null, 1.61, '7–15 dias', ''),
        v(70703, '40cm', 'Aço', '', null, null, null, 1.79, '7–15 dias', ''),
        v(70704, '60cm', 'Aço', '', null, null, null, 1.98, '7–15 dias', ''),
        v(70705, '80cm', 'Aço', '', null, null, null, 2.30, '7–15 dias', ''),
        v(70706, '100cm','Aço', '', null, null, null, 2.49, '7–15 dias', ''),
        v(70707, '150cm','Aço', '', null, null, null, 3.06, '7–15 dias', 'Pers. nas 2 faces +R$0,16'),
        v(70708, '160cm','Aço', '', null, null, null, 3.25, '7–15 dias', ''),
        v(70709, '200cm','Aço', '', null, null, null, 4.07, '7–15 dias', ''),
      ]},
      { id: 708, nome: 'Zlock Inox / AISI 304', variacoes: [
        v(70801, '30cm', 'Aço inox AISI 304', '', null, null, null, 2.59, '—', ''),
      ]},
      { id: 709, nome: 'Alicate Corte Zlock e Zajust', variacoes: [
        v(70901, 'Único', 'Aço', '', null, null, null, 63.00, '3 dias', ''),
      ]},
      { id: 710, nome: 'Lacre Zlock 3', variacoes: [
        v(71001, '27cm', 'Flandres', '', null, null, null, 1.41, '30–40 dias', 'Mínimo 1.000 pçs | Gravação a laser'),
      ]},
      { id: 711, nome: 'Lacre de Chumbo / Sinete', variacoes: [
        v(71101, '10mm diâm.', 'Chumbo', '', null, null, null, null, '3–5 dias', '250 pçs/kg — R$136,00/kg'),
        v(71102, '12mm diâm.', 'Chumbo', '', null, null, null, null, '3–5 dias', '200 pçs/kg — R$136,00/kg'),
        v(71103, '14mm diâm.', 'Chumbo', '', null, null, null, null, '3–5 dias', '160 pçs/kg — R$136,00/kg'),
        v(71104, '16mm diâm.', 'Chumbo', '', null, null, null, null, '3–5 dias', '107 pçs/kg — R$136,00/kg'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 8. AMARRILHO / ARAME
  // ════════════════════════════════════════════════════════════════
  {
    id: 8, categoria: 'Amarrilho e Arames',
    produtos: [
      { id: 801, nome: 'Amarrilho — Fecho de Arame (Twist Ties)', variacoes: [
        v(80101, '8cm/10cm/15cm/60cm', 'Papel/Arame', 'Preto/Branco', null, null, null, null, '5–10 dias', 'R$36,00 o kg. Demais cores sob consulta'),
      ]},
      { id: 802, nome: 'Arame Galvanizado para Lacres', variacoes: [
        v(80201, '2x26', 'Aço galvanizado', '', null, null, null, null, '3–7 dias', 'R$119,00 rolo/kg'),
        v(80202, '3 fios', 'Aço galvanizado', '', null, null, null, null, '3–7 dias', 'R$119,00 rolo/kg'),
      ]},
      { id: 803, nome: 'Arame Inox — 3 Fios', variacoes: [
        v(80301, '3 fios', 'Aço inox', '', null, null, null, null, '3–7 dias', 'R$329,00 rolo/kg'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 9. TAG / LACRE AUTENTICIDADE
  // ════════════════════════════════════════════════════════════════
  {
    id: 9, categoria: 'Tag / Lacre Autenticidade Personalizado',
    obs: 'Preços por milheiro conforme quantidade',
    produtos: [
      { id: 901, nome: 'Tag / Lacre Autenticidade', variacoes: [
        v(90101, '5.000 pçs',  'PP', 'Personalizável', null, null, 945.00, null, '15–20 dias', 'Apenas genérico 1 perna'),
        v(90102, '10.000 pçs', 'PP', 'Personalizável', null, null, 522.00, null, '15–20 dias', ''),
        v(90103, '15.000 pçs', 'PP', 'Personalizável', null, null, 374.00, null, '15–20 dias', ''),
        v(90104, '20.000 pçs', 'PP', 'Personalizável', null, null, 306.00, null, '15–20 dias', ''),
      ]},
      { id: 902, nome: 'Genérico 1 Perna', variacoes: [
        v(90201, 'Único', 'PP', 'Consultar cores', null, null, 34.00, null, '—', ''),
      ]},
      { id: 903, nome: 'Genérico Quadrado 2 Pernas', variacoes: [
        v(90301, 'Único', 'PP', 'Consultar cores', null, null, 169.00, null, '—', ''),
      ]},
      { id: 904, nome: 'Genérico Redondo 2 Pernas', variacoes: [
        v(90401, 'Único', 'PP', 'Consultar cores', null, null, 187.00, null, '—', ''),
      ]},
      { id: 905, nome: 'Genérico Rústico Sisal (Lançamento)', variacoes: [
        v(90501, 'Único', 'Sisal', '', null, null, 187.00, null, '—', 'Mínimo 5.000 peças'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 10. ABRAÇADEIRAS
  // ════════════════════════════════════════════════════════════════
  {
    id: 10, categoria: 'Abraçadeiras — Nacional',
    obs: 'Preços de milheiro. Pacotes de 100 peças. Prazo 3–5 dias.',
    produtos: [
      { id: 1001, nome: 'Abraçadeira Nacional Padrão', variacoes: [
        v(100101, '2,5mm x 100mm', 'Nylon', 'Branca/Preta',       null, null, 39.00,   null, '3–5 dias', ''),
        v(100102, '2,5mm x 100mm', 'Nylon', 'Amarela/Vd/Az/Vm',   null, null, 52.00,   null, '3–5 dias', ''),
        v(100103, '2,5mm x 140mm', 'Nylon', 'Branca/Preta',        null, null, 78.00,   null, '3–5 dias', ''),
        v(100104, '2,5mm x 200mm', 'Nylon', 'Branca/Preta',        null, null, 105.00,  null, '3–5 dias', ''),
        v(100105, '2,5mm x 200mm', 'Nylon', 'Amarela/Vd/Az/Vm',   null, null, 108.00,  null, '3–5 dias', ''),
        v(100106, '3,6mm x 150mm', 'Nylon', 'Branca/Preta',        null, null, 97.00,   null, '3–5 dias', ''),
        v(100107, '3,6mm x 150mm', 'Nylon', 'Amarela/Vd/Az/Vm',   null, null, 119.00,  null, '3–5 dias', ''),
        v(100108, '3,6mm x 200mm', 'Nylon', 'Branca/Preta',        null, null, 123.00,  null, '3–5 dias', ''),
        v(100109, '3,6mm x 200mm', 'Nylon', 'Amarela/Vd/Az/Vm',   null, null, 146.00,  null, '3–5 dias', ''),
        v(100110, '3,6mm x 300mm', 'Nylon', 'Branca/Preta',        null, null, 233.00,  null, '3–5 dias', ''),
        v(100111, '3,6mm x 300mm', 'Nylon', 'Amarela/Vd/Az/Vm',   null, null, 240.00,  null, '3–5 dias', ''),
        v(100112, '4,8mm x 200mm', 'Nylon', 'Branca/Preta',        null, null, 150.00,  null, '3–5 dias', ''),
        v(100113, '4,8mm x 200mm', 'Nylon', 'Amarela/Vd/Az/Vm',   null, null, 179.00,  null, '3–5 dias', ''),
        v(100114, '4,8mm x 230mm', 'Nylon', 'Branca/Preta',        null, null, 168.00,  null, '3–5 dias', ''),
        v(100115, '4,8mm x 250mm', 'Nylon', 'Branca/Preta',        null, null, 206.00,  null, '3–5 dias', ''),
        v(100116, '4,8mm x 280mm', 'Nylon', 'Branca/Preta',        null, null, 218.00,  null, '3–5 dias', ''),
        v(100117, '4,8mm x 300mm', 'Nylon', 'Branca/Preta',        null, null, 271.00,  null, '3–5 dias', ''),
        v(100118, '4,8mm x 390mm', 'Nylon', 'Branca/Preta',        null, null, 362.00,  null, '3–5 dias', ''),
        v(100119, '7,5mm x 230mm', 'Nylon', 'Branca/Preta',        null, null, 638.00,  null, '3–5 dias', ''),
        v(100120, '7,6mm x 380mm', 'Nylon', 'Branca/Preta',        null, null, 709.00,  null, '3–5 dias', ''),
        v(100121, '9,0mm x 535mm', 'Nylon', 'Branca/Preta',        null, null, 2861.00, null, '3–5 dias', ''),
        v(100122, '9,0mm x 1020mm','Nylon', 'Branca/Preta',        null, null, 5354.00, null, '3–5 dias', ''),
        v(100123, '13mm x 350mm',  'Nylon', 'Branca/Preta',        null, null, 1911.00, null, '3–5 dias', ''),
        v(100124, '13mm x 540mm',  'Nylon', 'Branca/Preta',        null, null, 1970.00, null, '3–5 dias', ''),
      ]},
    ],
  },
  {
    id: 11, categoria: 'Abraçadeiras — Promocional',
    obs: 'Todas com proteção UV. Prazo 5–7 dias.',
    produtos: [
      { id: 1101, nome: 'Abraçadeira Promocional (UV)', variacoes: [
        v(110101, '2,5mm x 100mm',  'Nylon UV', 'Branca/Preta', null, null, 32.00,   null, '5–7 dias', ''),
        v(110102, '2,5mm x 150mm',  'Nylon UV', 'Branca/Preta', null, null, 50.00,   null, '5–7 dias', ''),
        v(110103, '2,5mm x 200mm',  'Nylon UV', 'Branca/Preta', null, null, 55.00,   null, '5–7 dias', ''),
        v(110104, '2,5mm x 300mm',  'Nylon UV', 'Branca/Preta', null, null, 87.00,   null, '5–7 dias', ''),
        v(110105, '3,6mm x 150mm',  'Nylon UV', 'Branca/Preta', null, null, 65.00,   null, '5–7 dias', ''),
        v(110106, '3,6mm x 200mm',  'Nylon UV', 'Branca/Preta', null, null, 89.00,   null, '5–7 dias', ''),
        v(110107, '3,6mm x 250mm',  'Nylon UV', 'Branca/Preta', null, null, 98.00,   null, '5–7 dias', ''),
        v(110108, '3,6mm x 300mm',  'Nylon UV', 'Branca',       null, null, 139.00,  null, '5–7 dias', ''),
        v(110109, '4,8mm x 200mm',  'Nylon UV', 'Branca/Preta', null, null, 109.00,  null, '5–7 dias', ''),
        v(110110, '4,8mm x 300mm',  'Nylon UV', 'Preta',        null, null, 169.00,  null, '5–7 dias', ''),
        v(110111, '4,8mm x 350mm',  'Nylon UV', 'Branca/Preta', null, null, 205.00,  null, '5–7 dias', ''),
        v(110112, '4,8mm x 400mm',  'Nylon UV', 'Preta',        null, null, 249.00,  null, '5–7 dias', ''),
        v(110113, '4,8mm x 450mm',  'Nylon UV', 'Preta',        null, null, 265.00,  null, '5–7 dias', ''),
        v(110114, '4,8mm x 500mm',  'Nylon UV', 'Preta',        null, null, 242.00,  null, '5–7 dias', ''),
        v(110115, '7,2mm x 200mm',  'Nylon UV', 'Branca/Preta', null, null, 289.00,  null, '5–7 dias', ''),
        v(110116, '7,2mm x 300mm',  'Nylon UV', 'Branca/Preta', null, null, 374.00,  null, '5–7 dias', ''),
        v(110117, '7,2mm x 350mm',  'Nylon UV', 'Branca/Preta', null, null, 405.00,  null, '5–7 dias', ''),
        v(110118, '7,6mm x 400mm',  'Nylon UV', 'Branca/Preta', null, null, 415.00,  null, '5–7 dias', ''),
        v(110119, '7,6mm x 500mm',  'Nylon UV', 'Branca/Preta', null, null, 445.00,  null, '5–7 dias', ''),
        v(110120, '8,8mm x 450mm',  'Nylon UV', 'Branca/Preta', null, null, 945.00,  null, '5–7 dias', ''),
        v(110121, '9,0mm x 400mm',  'Nylon UV', 'Branca',       null, null, 1319.00, null, '5–7 dias', ''),
      ]},
    ],
  },
  {
    id: 12, categoria: 'Abraçadeiras — Especiais',
    produtos: [
      { id: 1201, nome: 'Abraçadeira Identificável (ZID)', variacoes: [
        v(120101, '2,5mm x 100mm', 'Nylon', 'Branca', null, null, 241.00, null, '5–7 dias', ''),
        v(120102, '2,5mm x 110mm', 'Nylon', 'Branca', null, null, 675.00, null, '5–7 dias', ''),
        v(120103, '75mm / 125mm',  'Nylon', 'Branca', null, null, 33.00,  null, '5–7 dias', 'Caixa com 5.000 unid'),
      ]},
      { id: 1202, nome: 'Trava Anel', variacoes: [
        v(120201, 'Único', 'PP', '', null, null, null, null, '5–7 dias', 'Consultar preço'),
      ]},
      { id: 1203, nome: 'Abraçadeira Aço Inox', variacoes: [
        v(120301, '150x4,6mm', 'Aço inox', '', null, null, 218.00, null, '—', ''),
        v(120302, '200x4,6mm', 'Aço inox', '', null, null, 238.00, null, '—', ''),
        v(120303, '250x4,6mm', 'Aço inox', '', null, null, 258.00, null, '—', ''),
        v(120304, '300x4,6mm', 'Aço inox', '', null, null, 278.00, null, '—', ''),
        v(120305, '400x4,6mm', 'Aço inox', '', null, null, 358.00, null, '—', ''),
        v(120306, '150x8mm',   'Aço inox', '', null, null, 378.00, null, '—', ''),
        v(120307, '200x8mm',   'Aço inox', '', null, null, 418.00, null, '—', ''),
        v(120308, '250x8mm',   'Aço inox', '', null, null, 458.00, null, '—', ''),
        v(120309, '300x8mm',   'Aço inox', '', null, null, 498.00, null, '—', ''),
        v(120310, '400x8mm',   'Aço inox', '', null, null, 598.00, null, '—', ''),
        v(120311, '200x10mm',  'Aço inox', '', null, null, 538.00, null, '—', ''),
        v(120312, '300x10mm',  'Aço inox', '', null, null, 558.00, null, '—', ''),
        v(120313, '400x10mm',  'Aço inox', '', null, null, 758.00, null, '—', ''),
      ]},
      { id: 1204, nome: 'Abraçadeira Reutilizável', variacoes: [
        v(120401, '7,6mm x 150mm Branca', 'Nylon', 'Branca', null, null, 649.00, null, '—', ''),
        v(120402, '7,6mm x 250mm Branca', 'Nylon', 'Branca', null, null, 849.00, null, '—', ''),
      ]},
      { id: 1205, nome: 'Zpin', variacoes: [
        v(120501, '25mm', 'PP', '', null, null, 17.00, null, '—', 'Vem 5.000 na caixa'),
        v(120502, '40mm', 'PP', '', null, null, 17.00, null, '—', 'Vem 5.000 na caixa'),
      ]},
      { id: 1206, nome: 'Fixador Autoadesivo para Fios', variacoes: [
        v(120601, '19x19 Branca/Preta', 'PP', '', null, null, 354.00, null, '—', ''),
        v(120602, '30x30 Branca/Preta', 'PP', '', null, null, 544.00, null, '—', ''),
      ]},
      { id: 1207, nome: 'Tubo Espiral', variacoes: [
        v(120701, '1/8"  Branca', 'PE', '', null, null, null, 1.80,  '—', 'por metro'),
        v(120702, '1/4"  Branca', 'PE', '', null, null, null, 1.99,  '—', 'por metro'),
        v(120703, '1/2"  Branca', 'PE', '', null, null, null, 4.65,  '—', 'por metro'),
        v(120704, '3/4"  Branca', 'PE', '', null, null, null, 7.99,  '—', 'por metro'),
        v(120705, '1"    Branca', 'PE', '', null, null, null, 13.50, '—', 'por metro'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 13. CADEADOS
  // ════════════════════════════════════════════════════════════════
  {
    id: 13, categoria: 'Cadeados',
    obs: 'Desconto somente acima de R$800,00 em compras. Prazo 15–20 dias para grandes quantidades.',
    produtos: [
      { id: 1301, nome: 'Cadeado Gold (Tamanho único / padrão)', variacoes: [
        v(130101, '20mm', 'Latão', '', null, 16.90, null, null, '15–20 dias', ''),
        v(130102, '25mm', 'Latão', '', null, 19.90, null, null, '15–20 dias', ''),
        v(130103, '30mm', 'Latão', '', null, 23.50, null, null, '15–20 dias', ''),
        v(130104, '35mm', 'Latão', '', null, 29.90, null, null, '15–20 dias', ''),
        v(130105, '40mm', 'Latão', '', null, 37.50, null, null, '15–20 dias', ''),
        v(130106, '45mm', 'Latão', '', null, 44.90, null, null, '15–20 dias', ''),
        v(130107, '50mm', 'Latão', '', null, 48.50, null, null, '15–20 dias', ''),
        v(130108, '60mm', 'Latão', '', null, 79.90, null, null, '15–20 dias', ''),
        v(130109, '70mm', 'Latão', '', null, 103.90,null, null, '15–20 dias', ''),
      ]},
      { id: 1302, nome: 'Cadeado PAPAIZ', variacoes: [
        v(130201, '50mm', 'Latão', '', null, 54.50, null, null, '15–20 dias', ''),
      ]},
      { id: 1303, nome: 'Cadeado Tradicional Colorido', variacoes: [
        v(130301, '23mm', 'Liga', 'Diversas cores', null, 52.50, null, null, '—', 'AM, AZ, BR, Cromado, PT, Rosa, VD, VM — consultar disponibilidade'),
        v(130302, '25mm', 'Latão','',               null, 23.50, null, null, '—', 'Temos em estoque'),
        v(130303, '40mm', 'Liga', 'Sob consulta',   null, 46.90, null, null, '—', ''),
      ]},
      { id: 1304, nome: 'Segredo Numérico', variacoes: [
        v(130401, '20mm', 'Zinco', '', null, 21.00, null, null, '—', 'Gold — 12 pçs mín | Papaiz R$20,30'),
        v(130402, '25mm', 'Zinco', '', null, 24.50, null, null, '—', 'Gold — 10 pçs mín | Papaiz R$24,50'),
        v(130403, '30mm', 'Zinco', '', null, 27.90, null, null, '—', 'Gold — 10 pçs mín | Papaiz R$24,50'),
        v(130404, '35mm', 'Zinco', '', null, 36.50, null, null, '—', 'Gold — 5 pçs mín  | Papaiz R$32,00'),
        v(130405, '40mm', 'Zinco', '', null, 46.50, null, null, '—', 'Gold — 5 pçs mín  | Papaiz R$44,50'),
      ]},
      { id: 1305, nome: 'Segredo Igual Tetra PAPAIZ', variacoes: [
        v(130501, '50mm', 'Aço', '', null, 189.00, null, null, '—', ''),
        v(130502, '60mm', 'Aço', '', null, 215.00, null, null, '—', ''),
        v(130503, '70mm', 'Aço', '', null, 256.00, null, null, '—', ''),
      ]},
      { id: 1306, nome: 'Cadeado Bloqueio', variacoes: [
        v(130601, '25mm', 'Nylon+Aço', '', null, 47.00, null, null, '—', ''),
        v(130602, '38mm', 'Nylon+Aço', '', null, 48.00, null, null, '—', ''),
        v(130603, '50mm', 'Nylon+Aço', '', null, 53.00, null, null, '—', ''),
      ]},
      { id: 1307, nome: 'Cadeado Bloqueio Haste Longa', variacoes: [
        v(130701, '35/50mm', 'Nylon+Aço', '', null, null, null, null, '—', 'Sob consulta'),
      ]},
      { id: 1308, nome: 'Corrente para Cadeado', variacoes: [
        v(130801, 'Único', 'Aço', '', null, 6.90, null, null, '—', 'Por peça'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 14. MÁQUINAS
  // ════════════════════════════════════════════════════════════════
  {
    id: 14, categoria: 'Máquinas e Acessórios',
    obs: 'Prazo 2–7 dias',
    produtos: [
      { id: 1401, nome: 'Máquina Lacradora Redonda', variacoes: [
        v(140101, 'Única', '', 'Vermelho', null, 109.00, null, null, '2–7 dias', 'Disponível somente na cor vermelha no momento'),
      ]},
      { id: 1402, nome: 'Máquina Lacradora Quadrada', variacoes: [
        v(140201, 'Única', '', '', null, 59.90, null, null, '2–7 dias', ''),
      ]},
      { id: 1403, nome: 'Máquina de Selar', variacoes: [
        v(140301, '20cm', '', '', null, 339.00, null, null, '2–7 dias', ''),
        v(140302, '30cm', '', '', null, 416.00, null, null, '2–7 dias', 'Outras medidas sob consulta'),
      ]},
      { id: 1404, nome: 'Refil para Máquina Selar 20cm', variacoes: [
        v(140401, '20cm', '', '', null, 33.60, null, null, '2–7 dias', 'Outras medidas sob consulta'),
      ]},
      { id: 1405, nome: 'Fita para Máquina Lacradora (Selar)', variacoes: [
        v(140501, '12mm x 80m', '', '', null, 3.29, null, null, '2–7 dias', 'Por unidade'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 15. FITAS
  // ════════════════════════════════════════════════════════════════
  {
    id: 15, categoria: 'Fitas',
    obs: 'Prazo 3–7 dias',
    produtos: [
      { id: 1501, nome: 'Fita Isolante Antichama', variacoes: [
        v(150101, '5 metros',  'PVC', 'Preta', null, 1.36, null, null, '3–7 dias', ''),
        v(150102, '10 metros', 'PVC', 'Preta', null, 2.30, null, null, '3–7 dias', ''),
      ]},
      { id: 1502, nome: 'Fita Zebrada para Sinalização', variacoes: [
        v(150201, '7cm x 100m', 'PE', 'Preta/Amarela', null, 12.00, null, null, '3–7 dias', ''),
        v(150202, '7cm x 150m', 'PE', 'Preta/Amarela', null, 13.00, null, null, '3–7 dias', ''),
      ]},
      { id: 1503, nome: 'Fita Dupla Face', variacoes: [
        v(150301, '24mm x 10m',  '', '', null, 8.33,  null, null, '3–7 dias', 'Por unidade'),
        v(150302, '48mm x 10m',  '', '', null, 15.00, null, null, '3–7 dias', 'Por unidade — outras medidas sob consulta'),
        v(150303, '24mm x 20m',  '', '', null, 15.99, null, null, '3–7 dias', 'Por unidade'),
      ]},
      { id: 1504, nome: 'Fita Adesiva', variacoes: [
        v(150401, '45mm x 100m', 'BOPP', 'Marrom/Transparente', null, 7.90, null, null, '3–7 dias', 'Por unidade'),
        v(150402, '48mm x 45m',  'BOPP', 'Marrom/Transparente', null, 4.80, null, null, '3–7 dias', 'Por unidade'),
      ]},
      { id: 1505, nome: 'Fita de Demarcação de Solo', variacoes: [
        v(150501, '48mm x 30m', 'PE', 'Amarela/Azul/Vermelha', null, 39.00, null, null, '3–7 dias', 'Por unidade'),
      ]},
      { id: 1506, nome: 'Fita Silver Tape', variacoes: [
        v(150601, '48mm x 50m', 'PE', 'Prata', null, 75.00, null, null, '3–7 dias', 'Por rolo'),
      ]},
      { id: 1507, nome: 'Fita Crepe', variacoes: [
        v(150701, '18mm x 50m', 'Papel', '', null, 6.90,  null, null, '3–7 dias', 'Por unidade'),
        v(150702, '24mm x 50m', 'Papel', '', null, 9.92,  null, null, '3–7 dias', 'Por unidade'),
        v(150703, '45mm x 50m', 'Papel', '', null, 11.20, null, null, '3–7 dias', 'Por unidade'),
      ]},
      { id: 1508, nome: 'Suporte para Fita Adesiva', variacoes: [
        v(150801, 'Para embalagens', '', '', null, 49.00, null, null, '3–7 dias', 'Por unidade'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 16. FITILHO
  // ════════════════════════════════════════════════════════════════
  {
    id: 16, categoria: 'Fitilho / Rafia',
    produtos: [
      { id: 1601, nome: 'Fitilho Torcido Grosso Cinza', variacoes: [
        v(160101, 'Rolo ~7kg / 500m', 'PP', 'Cinza', null, null, null, null, '—', 'R$274,00 rolo | R$139,00 acima de 15 rolos'),
      ]},
      { id: 1602, nome: 'Fitilho de Rafia Médio Cinza', variacoes: [
        v(160201, 'Rolo ~7kg', 'Rafia', 'Cinza', null, null, null, null, '—', 'R$11,20 por kg / 500 metros'),
      ]},
      { id: 1603, nome: 'Fitilho Macio Fino Branco', variacoes: [
        v(160301, 'Rolo 182m', 'PP', 'Branco', null, 19.99, null, null, '—', ''),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 17. MALOTES E BOLSAS
  // ════════════════════════════════════════════════════════════════
  {
    id: 17, categoria: 'Malotes e Bolsas',
    obs: 'Prazo 15–20 dias. Personalização +R$2,00/peça/cor (máx. 2 cores, mínimo 10 peças).',
    produtos: [
      { id: 1701, nome: 'Malote Correio', variacoes: [
        v(170101, '30x25x10cm', 'Courino', '',        null, 59.00,  null, null, '15–20 dias', ''),
        v(170102, '40x30x10cm', 'Courino', '',        null, 69.00,  null, null, '15–20 dias', ''),
        v(170103, '47x34x14cm', 'Courino', '',        null, 89.00,  null, null, '15–20 dias', ''),
        v(170104, '60x40x15cm', 'Courino', '',        null, 109.00, null, null, '15–20 dias', ''),
        v(170105, '60x45x18cm', 'Courino', '',        null, 119.00, null, null, '15–20 dias', ''),
        v(170106, '70x50x25cm', 'Courino', '',        null, 129.00, null, null, '15–20 dias', ''),
      ]},
      { id: 1702, nome: 'Pasta / Bolsa Nylon ou Emborrachada', variacoes: [
        v(170201, '40x35x8cm',  'Nylon/Emborrachado', '', null, 23.00, null, null, '15–20 dias', 'Impermeável'),
        v(170202, '30x40cm',    'Nylon/Emborrachado', '', null, 21.00, null, null, '15–20 dias', 'Impermeável'),
        v(170203, '15x20cm',    'Nylon/Emborrachado', '', null, 19.00, null, null, '15–20 dias', 'Impermeável'),
      ]},
      { id: 1703, nome: 'Pasta Lona', variacoes: [
        v(170301, '40x35x8cm', 'Lona', '', null, 26.00, null, null, '15–20 dias', ''),
        v(170302, '30x40cm',   'Lona', '', null, 23.00, null, null, '15–20 dias', ''),
      ]},
      { id: 1704, nome: 'Malote Urna Lona com Boca de Papelão', variacoes: [
        v(170401, '50x25x25cm', 'Lona', '', null, 102.00, null, null, '20–30 dias', 'Personalização a partir de 30 peças — bordado'),
      ]},
      { id: 1705, nome: 'Porta Sacola Supermercado', variacoes: [
        v(170501, 'Único', 'Lona', '', null, 44.00, null, null, '20–30 dias', 'Somente vender o que tiver em estoque'),
      ]},
      { id: 1706, nome: 'Pochete Nylon 600', variacoes: [
        v(170601, '~12x23x7cm princ. / ~8,5x13,5x3cm bolso', 'Nylon 600', '', null, 29.00, null, null, '20–30 dias', 'Lisa'),
      ]},
      { id: 1707, nome: 'Bolsa Térmica 5 Litros', variacoes: [
        v(170701, '5 litros', 'Nylon', '', null, 59.00, null, null, '20–30 dias', 'Lisa'),
      ]},
    ],
  },
  // ════════════════════════════════════════════════════════════════
  // 18. ETIQUETAS / OUTROS
  // ════════════════════════════════════════════════════════════════
  {
    id: 18, categoria: 'Etiquetas e Outros',
    produtos: [
      { id: 1801, nome: 'Etiqueta Adesiva Couche', variacoes: [
        v(180101, '34x23mm — 1.900 etiq. (mín. 5 rolos)',  'Papel couche', '', null, 135.00, null, null, '—', 'Por rolo'),
        v(180102, '34x23mm — 1.900 etiq. (mín. 10 rolos)', 'Papel couche', '', null, 109.00, null, null, '—', 'Por rolo'),
      ]},
      { id: 1802, nome: 'Dispenser de Senha', variacoes: [
        v(180201, 'Único', '', '', null, null, null, null, '—', 'Sob consulta'),
      ]},
      { id: 1803, nome: 'Rolo de Senha', variacoes: [
        v(180301, 'Único', '', '', null, 82.00, null, null, '—', ''),
      ]},
      { id: 1804, nome: 'Lacre Etiqueta', variacoes: [
        v(180401, 'Único', '', '', null, null, null, null, '—', 'Sob consulta'),
      ]},
      { id: 1805, nome: 'Placas de Identificação / Etiqueta Patrimônio', variacoes: [
        v(180501, 'Sob medida', 'Alumínio/Inox', '', null, null, null, null, '15–20 dias', 'Sob consulta — personalizadas'),
      ]},
    ],
  },
];

// ── Init localStorage ──────────────────────────────────────────────────────
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
function saveCatalogo(data) { localStorage.setItem(CAT_KEY, JSON.stringify(data)); }

const CAMPOS_PRECO = [
  { key: 'precoAtacado',  label: 'Atacado',   color: 'text-emerald-700' },
  { key: 'precoVarejo',   label: 'Varejo',    color: 'text-blue-700'    },
  { key: 'precoMilheiro', label: '/Milheiro', color: 'text-purple-700'  },
  { key: 'precoUnidade',  label: '/Unidade',  color: 'text-orange-700'  },
];

// ── MODAIS: formas ─────────────────────────────────────────────────────────
const VAZIO_CAT   = { categoria: '' };
const VAZIO_PROD  = { nome: '' };
const VAZIO_VAR   = { tamanho: '', material: '', cor: '', precoAtacado: '', precoVarejo: '', precoMilheiro: '', precoUnidade: '', prazo: '', obs: '' };

export default function Precos() {
  const { can } = useAuth();
  const [catalogo, setCatalogo]     = useState(initCatalogo);
  const [busca, setBusca]           = useState('');
  const [filtroCat, setFiltroCat]   = useState('');
  const [abertos, setAbertos]       = useState(() => {
    const m = {};
    CATALOGO_SEED.forEach(c => { m[c.id] = true; c.produtos.forEach(p => { m[`p${p.id}`] = false; }); });
    return m;
  });

  // Modais
  const [modalCat,  setModalCat]  = useState(null); // {modo:'novo'|'editar', dados}
  const [modalProd, setModalProd] = useState(null); // {modo, catId, dados}
  const [modalVar,  setModalVar]  = useState(null); // {modo, catId, prodId, dados}
  const [modalDel,  setModalDel]  = useState(null); // {tipo, catId, prodId?, varId?}
  const [formCat,  setFormCat]    = useState(VAZIO_CAT);
  const [formProd, setFormProd]   = useState(VAZIO_PROD);
  const [formVar,  setFormVar]    = useState(VAZIO_VAR);

  const persist = useCallback((novo) => { setCatalogo(novo); saveCatalogo(novo); }, []);

  function toggle(key) { setAbertos(p => ({ ...p, [key]: !p[key] })); }

  // ── Stats ──────────────────────────────────────────────────────────────
  const { totalCats, totalVars, comPreco } = useMemo(() => {
    let tv = 0, cp = 0;
    catalogo.forEach(c => c.produtos.forEach(p => p.variacoes.forEach(vv => {
      tv++;
      if ([vv.precoAtacado, vv.precoVarejo, vv.precoMilheiro, vv.precoUnidade].some(x => x != null && x !== '')) cp++;
    })));
    return { totalCats: catalogo.length, totalVars: tv, comPreco: cp };
  }, [catalogo]);

  // ── Filtro ─────────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    const q = busca.toLowerCase();
    return catalogo
      .filter(c => !filtroCat || c.id === Number(filtroCat))
      .map(c => ({
        ...c,
        produtos: c.produtos
          .filter(p => !q || p.nome.toLowerCase().includes(q) ||
            p.variacoes.some(vv => (vv.tamanho + vv.material + vv.cor).toLowerCase().includes(q)))
          .map(p => ({
            ...p,
            variacoes: q
              ? p.variacoes.filter(vv => (p.nome + vv.tamanho + vv.material + vv.cor).toLowerCase().includes(q))
              : p.variacoes,
          })).filter(p => p.variacoes.length > 0),
      })).filter(c => c.produtos.length > 0);
  }, [catalogo, busca, filtroCat]);

  // ── CRUD Categoria ─────────────────────────────────────────────────────
  function salvarCat(e) {
    e.preventDefault();
    if (modalCat.modo === 'novo') {
      const novo = { id: nextId(catalogo), categoria: formCat.categoria, produtos: [] };
      persist([...catalogo, novo]);
    } else {
      persist(catalogo.map(c => c.id === modalCat.dados.id ? { ...c, categoria: formCat.categoria } : c));
    }
    setModalCat(null);
  }

  // ── CRUD Produto ───────────────────────────────────────────────────────
  function salvarProd(e) {
    e.preventDefault();
    const cats = catalogo.map(c => {
      if (c.id !== modalProd.catId) return c;
      const prods = modalProd.modo === 'novo'
        ? [...c.produtos, { id: nextId(c.produtos), nome: formProd.nome, variacoes: [] }]
        : c.produtos.map(p => p.id === modalProd.dados.id ? { ...p, nome: formProd.nome } : p);
      return { ...c, produtos: prods };
    });
    persist(cats);
    setModalProd(null);
  }

  // ── CRUD Variação ──────────────────────────────────────────────────────
  function salvarVar(e) {
    e.preventDefault();
    const parse = (x) => (x === '' || x == null) ? null : Number(x);
    const dadosVar = {
      ...formVar,
      precoAtacado:  parse(formVar.precoAtacado),
      precoVarejo:   parse(formVar.precoVarejo),
      precoMilheiro: parse(formVar.precoMilheiro),
      precoUnidade:  parse(formVar.precoUnidade),
    };
    const cats = catalogo.map(c => {
      if (c.id !== modalVar.catId) return c;
      return {
        ...c, produtos: c.produtos.map(p => {
          if (p.id !== modalVar.prodId) return p;
          const vars = modalVar.modo === 'novo'
            ? [...p.variacoes, { id: nextId(p.variacoes), ...dadosVar }]
            : p.variacoes.map(vv => vv.id === modalVar.dados.id ? { ...vv, ...dadosVar } : vv);
          return { ...p, variacoes: vars };
        }),
      };
    });
    persist(cats);
    setModalVar(null);
  }

  // ── Excluir ────────────────────────────────────────────────────────────
  function confirmarDel() {
    const { tipo, catId, prodId, varId } = modalDel;
    let cats = catalogo;
    if (tipo === 'cat')  cats = cats.filter(c => c.id !== catId);
    if (tipo === 'prod') cats = cats.map(c => c.id !== catId ? c : { ...c, produtos: c.produtos.filter(p => p.id !== prodId) });
    if (tipo === 'var')  cats = cats.map(c => c.id !== catId ? c : { ...c, produtos: c.produtos.map(p => p.id !== prodId ? p : { ...p, variacoes: p.variacoes.filter(vv => vv.id !== varId) }) });
    persist(cats);
    setModalDel(null);
  }

  // ── helpers modal open ─────────────────────────────────────────────────
  function abrirNovaVar(catId, prodId) {
    setFormVar(VAZIO_VAR);
    setModalVar({ modo: 'novo', catId, prodId });
  }
  function abrirEditarVar(catId, prodId, varD) {
    setFormVar({ ...varD, precoAtacado: varD.precoAtacado ?? '', precoVarejo: varD.precoVarejo ?? '', precoMilheiro: varD.precoMilheiro ?? '', precoUnidade: varD.precoUnidade ?? '' });
    setModalVar({ modo: 'editar', catId, prodId, dados: varD });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LucideTag className="w-6 h-6 text-purple-600" />
            Catálogo de Preços
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {totalCats} categorias · {totalVars} variações/SKUs · {comPreco} com preço definido
          </p>
          <p className="text-gray-400 text-xs mt-0.5">Tabela referência: 12/2025</p>
        </div>
        {can.editarPrecos && (
          <button
            onClick={() => { setFormCat(VAZIO_CAT); setModalCat({ modo: 'novo' }); }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition text-sm"
          >
            <LucidePlus className="w-4 h-4" /> Nova Categoria
          </button>
        )}
      </div>

      {/* Info varejo */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 leading-relaxed">
        <strong>Regras varejo:</strong> Materiais de estoque +30%. Pedidos no cartão: 1x–2x sem acréscimo (R$500–5k) · 3x +2,75% (5k–10k) · 4x +3,48% (10k–20k).
        Laser: priorizar cores claras. Gravação em cód. barras somente Amarelo e Branco.
      </div>

      {!can.verPrecos && (
        <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-400">Sem acesso ao catálogo.</div>
      )}

      {can.verPrecos && (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative">
              <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Buscar produto ou tamanho..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              value={filtroCat}
              onChange={e => setFiltroCat(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {catalogo.map(c => <option key={c.id} value={c.id}>{c.categoria}</option>)}
            </select>
          </div>

          {/* Banner somente visualização */}
          {!can.editarPrecos && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 text-blue-700 text-sm">
              <LucideInfo className="w-4 h-4 flex-shrink-0" />
              Você está no modo de <strong>somente visualização</strong>. Apenas o Admin pode editar o catálogo.
            </div>
          )}

          {/* Acordeão */}
          <div className="space-y-3">
            {lista.map(cat => (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                {/* Header categoria */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition select-none"
                  onClick={() => toggle(cat.id)}
                >
                  {abertos[cat.id]
                    ? <LucideChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    : <LucideChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  <span className="font-bold text-gray-800 flex-1">{cat.categoria}</span>
                  {cat.obs && <span className="text-xs text-gray-400 hidden md:block max-w-xs truncate">{cat.obs}</span>}
                  <span className="text-xs text-gray-400">{cat.produtos.reduce((s, p) => s + p.variacoes.length, 0)} SKUs</span>
                  {can.editarPrecos && (
                    <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setFormProd(VAZIO_PROD); setModalProd({ modo: 'novo', catId: cat.id }); }}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-600 transition" title="Novo produto">
                        <LucidePlus className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setFormCat({ categoria: cat.categoria }); setModalCat({ modo: 'editar', dados: cat }); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition" title="Editar categoria">
                        <LucidePencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setModalDel({ tipo: 'cat', catId: cat.id })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition" title="Excluir categoria">
                        <LucideTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Produtos */}
                {abertos[cat.id] && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {cat.produtos.map(prod => (
                      <div key={prod.id}>

                        {/* Header produto */}
                        <div
                          className="flex items-center gap-2 px-6 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition select-none"
                          onClick={() => toggle(`p${prod.id}`)}
                        >
                          {abertos[`p${prod.id}`]
                            ? <LucideChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            : <LucideChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <LucidePackage className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-700 flex-1 text-sm">{prod.nome}</span>
                          <span className="text-xs text-gray-400">{prod.variacoes.length} variação{prod.variacoes.length !== 1 ? 'ões' : ''}</span>
                          {can.editarPrecos && (
                            <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                              <button onClick={() => abrirNovaVar(cat.id, prod.id)}
                                className="p-1 rounded-lg hover:bg-purple-100 text-purple-600" title="Nova variação">
                                <LucidePlus className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { setFormProd({ nome: prod.nome }); setModalProd({ modo: 'editar', catId: cat.id, dados: prod }); }}
                                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500">
                                <LucidePencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => setModalDel({ tipo: 'prod', catId: cat.id, prodId: prod.id })}
                                className="p-1 rounded-lg hover:bg-red-50 text-red-400">
                                <LucideTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Variações */}
                        {abertos[`p${prod.id}`] && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-purple-50 text-purple-700">
                                  <th className="px-4 py-2 text-left font-semibold">Tamanho</th>
                                  <th className="px-4 py-2 text-left font-semibold">Material</th>
                                  <th className="px-4 py-2 text-left font-semibold">Cor</th>
                                  <th className="px-4 py-2 text-right font-semibold text-emerald-700">Atacado</th>
                                  <th className="px-4 py-2 text-right font-semibold text-blue-700">Varejo</th>
                                  <th className="px-4 py-2 text-right font-semibold text-purple-700">/Milheiro</th>
                                  <th className="px-4 py-2 text-right font-semibold text-orange-700">/Unidade</th>
                                  <th className="px-4 py-2 text-left font-semibold">Prazo</th>
                                  <th className="px-4 py-2 text-left font-semibold">Obs</th>
                                  {can.editarPrecos && <th className="px-4 py-2 text-center font-semibold">Ações</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {prod.variacoes.map(varD => (
                                  <tr key={varD.id} className="hover:bg-purple-50/30">
                                    <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{varD.tamanho || '—'}</td>
                                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{varD.material || '—'}</td>
                                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{varD.cor || '—'}</td>
                                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">{brl(varD.precoAtacado)}</td>
                                    <td className="px-4 py-2.5 text-right font-semibold text-blue-700 whitespace-nowrap">{brl(varD.precoVarejo)}</td>
                                    <td className="px-4 py-2.5 text-right font-semibold text-purple-700 whitespace-nowrap">{brl(varD.precoMilheiro)}</td>
                                    <td className="px-4 py-2.5 text-right font-semibold text-orange-700 whitespace-nowrap">{brl(varD.precoUnidade)}</td>
                                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{varD.prazo || '—'}</td>
                                    <td className="px-4 py-2.5 text-gray-400 max-w-[200px] truncate" title={varD.obs}>{varD.obs || '—'}</td>
                                    {can.editarPrecos && (
                                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                        <button onClick={() => abrirEditarVar(cat.id, prod.id, varD)}
                                          className="p-1 rounded hover:bg-purple-100 text-purple-500 mr-1">
                                          <LucidePencil className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => setModalDel({ tipo: 'var', catId: cat.id, prodId: prod.id, varId: varD.id })}
                                          className="p-1 rounded hover:bg-red-50 text-red-400">
                                          <LucideTrash2 className="w-3 h-3" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                                {can.editarPrecos && (
                                  <tr>
                                    <td colSpan={can.editarPrecos ? 10 : 9} className="px-4 py-2">
                                      <button onClick={() => abrirNovaVar(cat.id, prod.id)}
                                        className="flex items-center gap-1 text-purple-500 hover:text-purple-700 text-xs font-medium transition">
                                        <LucidePlus className="w-3 h-3" /> Adicionar variação
                                      </button>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {lista.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <LucideSearch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Nenhum resultado para "<strong>{busca}</strong>"
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL CATEGORIA ── */}
      {modalCat && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{modalCat.modo === 'novo' ? 'Nova Categoria' : 'Editar Categoria'}</h3>
              <button onClick={() => setModalCat(null)} className="p-1 hover:bg-gray-100 rounded-lg"><LucideX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={salvarCat} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nome da Categoria *</label>
                <input required className="border rounded-lg px-3 py-2 w-full mt-1 text-sm" value={formCat.categoria}
                  onChange={e => setFormCat(f => ({ ...f, categoria: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl transition">Salvar</button>
                <button type="button" onClick={() => setModalCat(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL PRODUTO ── */}
      {modalProd && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{modalProd.modo === 'novo' ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button onClick={() => setModalProd(null)} className="p-1 hover:bg-gray-100 rounded-lg"><LucideX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={salvarProd} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nome do Produto *</label>
                <input required className="border rounded-lg px-3 py-2 w-full mt-1 text-sm" value={formProd.nome}
                  onChange={e => setFormProd(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl transition">Salvar</button>
                <button type="button" onClick={() => setModalProd(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL VARIAÇÃO ── */}
      {modalVar && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-900">{modalVar.modo === 'novo' ? 'Nova Variação' : 'Editar Variação'}</h3>
              <button onClick={() => setModalVar(null)} className="p-1 hover:bg-gray-100 rounded-lg"><LucideX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={salvarVar} className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'tamanho', label: 'Tamanho', ph: 'ex: 16mm, 30x40...' },
                  { key: 'material', label: 'Material', ph: 'ex: PP, Nylon...' },
                  { key: 'cor', label: 'Cor', ph: 'ex: Amarelo, Azul...' },
                  { key: 'prazo', label: 'Prazo', ph: 'ex: 10–15 dias' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                    <input className="border rounded-lg px-3 py-2 w-full mt-1 text-sm" placeholder={f.ph}
                      value={formVar[f.key]} onChange={e => setFormVar(fv => ({ ...fv, [f.key]: e.target.value }))} />
                  </div>
                ))}
                {CAMPOS_PRECO.map(f => (
                  <div key={f.key}>
                    <label className={`text-xs font-semibold ${f.color}`}>{f.label} (R$)</label>
                    <input type="number" step="0.01" min="0"
                      className="border rounded-lg px-3 py-2 w-full mt-1 text-sm"
                      placeholder="0,00"
                      value={formVar[f.key]}
                      onChange={e => setFormVar(fv => ({ ...fv, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Observação</label>
                  <input className="border rounded-lg px-3 py-2 w-full mt-1 text-sm"
                    value={formVar.obs} onChange={e => setFormVar(fv => ({ ...fv, obs: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition">Salvar</button>
                <button type="button" onClick={() => setModalVar(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR EXCLUSÃO ── */}
      {modalDel && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <LucideTrash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Confirmar Exclusão</h3>
            <p className="text-gray-500 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={confirmarDel} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition">Excluir</button>
              <button onClick={() => setModalDel(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
