// Precos.jsx — Catálogo comercial completo · Tabela 12/2025
// ADMIN: edita tudo | SUPERVISAO + COMERCIAL: somente visualização
import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Pencil, Trash2, X,
  Search, Tag, Package, Info, ShieldCheck, AlertTriangle,
  Clock, Star, Zap, Box, Lock, Scissors, Wrench, Layers,
  Archive, Briefcase, Thermometer,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CAT_KEY     = 'zkCatalogo';
const CAT_VERSION = 'v3';
const CAT_VER_KEY = 'zkCatalogoVersion';

// ── helpers ───────────────────────────────────────────────────────────────
const brl = (val) => {
  if (val == null || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? String(val) : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const nextId = (arr) => (arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1);
const v = (id, tamanho, material, cor, precoAtacado, precoVarejo, precoMilheiro, precoUnidade, prazo, obs = '') =>
  ({ id, tamanho, material, cor, precoAtacado, precoVarejo, precoMilheiro, precoUnidade, prazo, obs });

// ── CATÁLOGO SEED v3 ──────────────────────────────────────────────────────
const CATALOGO_SEED = [
  /* ══════════════════════════════════════════════════════
     1. LACRES PP
  ══════════════════════════════════════════════════════ */
  {
    id: 1, categoria: 'Lacres PP', icon: 'tag', color: 'purple',
    obs: 'Varejo: +30% sobre materiais de estoque. Priorizar venda de estoque para saída mais rápida.',
    produtos: [
      { id: 101, nome: 'DT — Dupla Trava', variacoes: [
        v(10101,'16mm','PP','',  95.00, null, 13.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10102,'16mm','PP','',  85.00, null, 12.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10103,'16mm','PP','',  89.00, null, null,  null, '10–15 dias', 'Sem varejo em pacote'),
        v(10104,'16mm','PP','', 108.00, null, null,  null, '20–30 dias', ''),
        v(10105,'16mm','PP','', 119.00, null, null,  null, '15–20 dias', 'Sem varejo em pacote'),
        v(10106,'23mm','PP','', 139.00, null, null,  null, '20–30 dias', ''),
        v(10107,'25mm','PP','', 238.00, null, null,  null, '10–15 dias', ''),
        v(10108,'31mm','PP','', 204.00, null, 27.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10109,'36mm','PP','', 239.00, null, 32.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10110,'41mm','PP','', 279.00, null, 38.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10111,'45mm','PP','', 339.00, null, 41.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10112,'50mm','PP','', 379.00, null, 44.00, null, '10–15 dias', 'Somente se tiver em estoque'),
        v(10113,'55mm','PP','', 419.00, null, 49.00, null, '10–15 dias', 'Acima de 11 pcts atacado / Varejo até 10 pcts'),
      ]},
      { id: 102, nome: 'DT — Dupla Trava Corte Fácil', variacoes: [
        v(10201,'23mm','PP','', 179.00, null, null, null, '15–20 dias', 'Sem varejo em pacote'),
        v(10202,'27mm','PP','', 259.00, null, null, null, '15–20 dias', 'Sem varejo em pacote'),
        v(10203,'32mm','PP','', 259.00, null, null, null, '15–20 dias', ''),
        v(10204,'35mm','PP','', 269.00, null, null, null, '15–20 dias', ''),
        v(10205,'37mm','PP','', 519.00, null, null, null, '15–20 dias', ''),
      ]},
      { id: 103, nome: 'ES — Escada Alta', variacoes: [
        v(10301,'23mm','PP','', 115.00, null, 15.00, null, '10–15 dias', 'CF — Acima de 11 pcts atacado / Varejo até 10 pcts'),
        v(10302,'23mm','PP','', 119.00, null, null,  null, '10–15 dias', 'Sem varejo em pacote'),
        v(10303,'28mm','PP','', 259.00, null, null,  null, '10–15 dias', 'Escada Alta ou com Corte Fácil'),
        v(10304,'30mm','PP','', 374.00, null, null,  null, '20–30 dias', 'Protocolo — Mínimo 1.000 pçs'),
        v(10305,'35mm','PP','', 349.00, null, null,  null, '20–30 dias', 'Trava Dupla'),
        v(10306,'45mm','PP','', 449.00, null, null,  null, '20–30 dias', 'Trava Dupla'),
      ]},
      { id: 104, nome: 'EP — Espinha de Peixe', variacoes: [
        v(10401,'23mm','PP','', 125.00, null, null, null, '10–15 dias', 'Acima de 11 pcts'),
        v(10402,'23mm','PP','', 189.00, null, null, null, '10–20 dias', 'Corte Fácil'),
        v(10403,'42mm','PP','', 309.00, null, null, null, '10–15 dias', 'Sem varejo em pacote'),
      ]},
      { id: 105, nome: 'TU — Trava Única', variacoes: [
        v(10501,'31mm','PP','', 350.00, null, null, null, '15–20 dias', 'Sem varejo em pacote'),
      ]},
      { id: 106, nome: 'TM — Trava Metálica', variacoes: [
        v(10601,'45mm','PP','', 986.00, null, null, null, '20–30 dias', ''),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     2. LACRES NYLON
  ══════════════════════════════════════════════════════ */
  {
    id: 2, categoria: 'Lacres Nylon', icon: 'layers', color: 'cyan',
    obs: '',
    produtos: [
      { id: 201, nome: 'ES — Escada Alta Nylon', variacoes: [
        v(20101,'16mm  seco',    'NY','', 119.00, null, 18.00, null, '10–15 dias', 'Acima de 11 pcts / Varejo até 10 pcts'),
        v(20102,'16mm  molhado', 'NY','', 194.00, null, null,  null, '10–15 dias', ''),
        v(20103,'23mm  seco',    'NY','', 149.00, null, 21.00, null, '10–15 dias', 'Acima de 11 pcts / Varejo até 10 pcts'),
        v(20104,'23mm  molhado', 'NY','', 239.00, null, null,  null, '10–15 dias', ''),
        v(20105,'28mm  molhado', 'NY','', 309.00, null, null,  null, '—',          ''),
        v(20106,'36mm',          'NY','', 884.00, null, null,  null, '25–30 dias', ''),
        v(20107,'40mm',          'NT','', 918.00, null, null,  null, '25–30 dias', ''),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     3. LACRE DE SACOLA
  ══════════════════════════════════════════════════════ */
  {
    id: 3, categoria: 'Lacre de Sacola', icon: 'archive', color: 'pink',
    obs: 'Prazo 7–10 dias',
    produtos: [
      { id: 301, nome: 'Lacre de Sacola', variacoes: [
        v(30101,'Rígido',   'PP','', null, null,  45.00, null, '7–10 dias', ''),
        v(30102,'Flexível', 'PP','', null, null,  49.00, null, '7–10 dias', ''),
        v(30103,'GG',       'PP','', null, null, 136.00, null, '7–10 dias', ''),
      ]},
      { id: 302, nome: 'Lacre Anel / Ampola', variacoes: [
        v(30201,'M30 / M22 / CO2', 'PP','', null, null, 187.00, null, '7–10 dias', ''),
        v(30202,'Ampola',          'PP','', null, null, 221.00, null, '7–10 dias', ''),
      ]},
      { id: 303, nome: 'Aplicador de Lacre de Sacola', variacoes: [
        v(30301,'Único','','', null, null, null, 25.00, '15–20 dias', 'Prazo gravado: 30–45 dias'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     4. LACRE MZA / ALC
  ══════════════════════════════════════════════════════ */
  {
    id: 4, categoria: 'Lacre MZA para Caixa ALC', icon: 'box', color: 'orange',
    obs: 'Dimensões: 45x16x21mm · Gravação a Laser',
    produtos: [
      { id: 401, nome: 'Lacre MZA / ALC', variacoes: [
        v(40101,'45x16x21mm','PP','Liso',         null, null, 170.00, null, '15–20 dias', ''),
        v(40102,'45x16x21mm','PP','Personalizado', null, null, 180.00, null, '30–45 dias', '+R$10,00/mlr personalização'),
        v(40103,'45x16x21mm','PP','Numerado',      null, null, 180.00, null, '30–45 dias', '+R$10,00/mlr numeração'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     5. LACRE ZNAN
  ══════════════════════════════════════════════════════ */
  {
    id: 5, categoria: 'Lacre Znan', icon: 'zap', color: 'yellow',
    obs: 'Laser: priorizar cores claras · Código de barras somente Amarelo e Branco',
    produtos: [
      { id: 501, nome: 'Znan — Aço / PP', variacoes: [
        v(50101,'Único','PP','Sem Rabicho',           null, null, 149.00, null, '15–20 dias', ''),
        v(50102,'Único','PP','Com Rabicho',           null, null, 159.00, null, '15–20 dias', ''),
        v(50103,'Único','PP','Com gravação na caneca',null, null, 285.00, null, '30–40 dias', ''),
        v(50104,'Único','Policarbonato','',           null, null, 435.00, null, '—',          ''),
      ]},
      { id: 502, nome: 'Znan com Arame 2x26', variacoes: [
        v(50201,'20cm','PP+Arame','', null, null, 239.00, null, '20–30 dias', ''),
        v(50202,'25cm','PP+Arame','', null, null, 250.00, null, '20–30 dias', ''),
        v(50203,'30cm','PP+Arame','', null, null, 269.00, null, '20–30 dias', ''),
        v(50204,'35cm','PP+Arame','', null, null, 275.00, null, '20–30 dias', ''),
        v(50205,'40cm','PP+Arame','', null, null, 296.00, null, '20–30 dias', ''),
        v(50206,'45cm','PP+Arame','', null, null, 310.00, null, '20–30 dias', ''),
        v(50207,'50cm','PP+Arame','', null, null, 340.00, null, '20–30 dias', ''),
        v(50208,'55cm','PP+Arame','', null, null, 370.00, null, '20–30 dias', ''),
      ]},
      { id: 503, nome: 'Znan Fita Metálica (2ª linha)', variacoes: [
        v(50301,'15cm','Fita metálica','', null, null, 239.00, null, '35–45 dias', 'Consultar disponibilidade'),
        v(50302,'20cm','Fita metálica','', null, null, 252.00, null, '35–45 dias', ''),
        v(50303,'30cm','Fita metálica','', null, null, 315.00, null, '35–45 dias', ''),
        v(50304,'30cm','Fita metálica','', null, null, 354.00, null, '35–45 dias', 'Versão premiada'),
        v(50305,'35cm','Fita metálica','', null, null, 399.00, null, '35–45 dias', ''),
        v(50306,'40cm','Fita metálica','', null, null, 430.00, null, '35–45 dias', ''),
        v(50307,'50cm','Fita metálica','', null, null, 453.00, null, '35–45 dias', ''),
        v(50308,'60cm','Fita metálica','', null, null, 532.00, null, '35–45 dias', ''),
        v(50309,'70cm','Fita metálica','', null, null, 616.00, null, '35–45 dias', ''),
      ]},
      { id: 504, nome: 'Znan com Arame 2x26 POLICARBONATO', variacoes: [
        v(50401,'30cm','Policarbonato+Arame','', null, null, 589.00, null, '45–50 dias', ''),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     6. AMARRILHO / ARAMES
  ══════════════════════════════════════════════════════ */
  {
    id: 6, categoria: 'Amarrilho e Arames', icon: 'scissors', color: 'teal',
    obs: 'Prazo 3–7 dias',
    produtos: [
      { id: 601, nome: 'Amarrilho / Fecho Lacre de Arame', variacoes: [
        v(60101,'8cm / 10cm (1.340 pçs/kg)','Papel+Arame','Preto/Branco', null, null, null, null, '5–10 dias', 'R$36,00/kg — demais cores sob consulta'),
        v(60102,'15cm (890 pçs/kg)','Papel+Arame','Preto/Branco',          null, null, null, null, '5–10 dias', 'R$36,00/kg'),
        v(60103,'60cm','Papel+Arame','Preto/Branco',                        null, null, null, null, '5–10 dias', 'R$36,00/kg — outras medidas sob consulta'),
      ]},
      { id: 602, nome: 'Arames Galvanizados', variacoes: [
        v(60201,'2x26 ou 3x26','Aço galvanizado','', null, null, null, null, '3–7 dias', 'R$119,00 rolo/kg'),
      ]},
      { id: 603, nome: 'Arame Inox — 3 Fios', variacoes: [
        v(60301,'3 fios','Aço inox','', null, null, null, null, '3–7 dias', 'R$329,00 rolo/kg'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     7. TAG / LACRE AUTENTICIDADE
  ══════════════════════════════════════════════════════ */
  {
    id: 7, categoria: 'Tag / Lacre Autenticidade Personalizado', icon: 'star', color: 'amber',
    obs: 'Preços por milheiro conforme quantidade mínima.',
    produtos: [
      { id: 701, nome: 'Tag Lacre Autenticidade Personalizado', variacoes: [
        v(70101,'5.000 pçs', 'PP','Personalizável', null, null,  945.00, null, '15–20 dias', 'Preço por milheiro'),
        v(70102,'10.000 pçs','PP','Personalizável', null, null,  522.00, null, '15–20 dias', ''),
        v(70103,'15.000 pçs','PP','Personalizável', null, null,  374.00, null, '15–20 dias', ''),
        v(70104,'20.000 pçs','PP','Personalizável', null, null,  306.00, null, '15–20 dias', ''),
      ]},
      { id: 702, nome: 'Genérico 1 Perna', variacoes: [
        v(70201,'Único','PP','Consultar cores', null, null,  34.00, null, '—', ''),
      ]},
      { id: 703, nome: 'Genérico 2 Pernas — Quadrado', variacoes: [
        v(70301,'Único','PP','Consultar cores', null, null, 169.00, null, '—', ''),
      ]},
      { id: 704, nome: 'Genérico 2 Pernas — Redondo', variacoes: [
        v(70401,'Único','PP','Consultar cores', null, null, 187.00, null, '—', ''),
      ]},
      { id: 705, nome: 'Genérico Rústico Sisal (Lançamento)', variacoes: [
        v(70501,'Único','Sisal','', null, null, 187.00, null, '—', 'Mínimo 5.000 peças'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     8. LACRES METÁLICOS
  ══════════════════════════════════════════════════════ */
  {
    id: 8, categoria: 'Lacres Metálicos', icon: 'shield', color: 'slate',
    obs: '',
    produtos: [
      { id: 801, nome: 'Lacre Zpino (Pino Bolt)', variacoes: [
        v(80101,'Único','Aço','Amarelo (pronta entrega)', null, null, null, 3.75, '—', 'Somente amarelo em pronta entrega'),
      ]},
      { id: 802, nome: 'Lacre Blindado Ajustável', variacoes: [
        v(80201,'30cm','Aço galvanizado','', null, null, null, 1.25, '5–10 dias', 'Cabo 1,5mm'),
        v(80202,'40cm','Aço galvanizado','', null, null, null, 1.32, '5–10 dias', 'Cabo 1,5mm'),
      ]},
      { id: 803, nome: 'Zlock 1 — Aço Galv. / ZAJUST (5–10 dias)', variacoes: [
        v(80301, '15cm','Aço galv.','', null, null, null, 1.19, '5–10 dias', 'Cabo 1,5mm'),
        v(80302, '20cm','Aço galv.','', null, null, null, 1.26, '5–10 dias', ''),
        v(80303, '25cm','Aço galv.','', null, null, null, 1.31, '5–10 dias', ''),
        v(80304, '30cm','Aço galv.','', null, null, null, 1.37, '5–10 dias', ''),
        v(80305, '40cm','Aço galv.','', null, null, null, 1.48, '5–10 dias', ''),
        v(80306, '50cm','Aço galv.','', null, null, null, 1.67, '5–10 dias', ''),
        v(80307, '60cm','Aço galv.','', null, null, null, 1.78, '5–10 dias', ''),
        v(80308, '70cm','Aço galv.','', null, null, null, 1.89, '5–10 dias', ''),
        v(80309, '80cm','Aço galv.','', null, null, null, 2.12, '5–10 dias', ''),
        v(80310, '90cm','Aço galv.','', null, null, null, 2.24, '5–10 dias', ''),
        v(80311,'100cm','Aço galv.','', null, null, null, 2.26, '5–10 dias', ''),
        v(80312,'150cm','Aço galv.','', null, null, null, 2.36, '5–10 dias', ''),
      ]},
      { id: 804, nome: 'Zajust — Aço Galv. (7–15 dias)', variacoes: [
        v(80401, '15cm','Aço galv.','', null, null, null, 1.89, '7–15 dias', 'Cabo 1,5mm'),
        v(80402, '20cm','Aço galv.','', null, null, null, 2.09, '7–15 dias', ''),
        v(80403, '30cm','Aço galv.','', null, null, null, 2.18, '7–15 dias', ''),
        v(80404, '40cm','Aço galv.','', null, null, null, 2.25, '7–15 dias', ''),
        v(80405, '50cm','Aço galv.','', null, null, null, 2.34, '7–15 dias', ''),
        v(80406, '60cm','Aço galv.','', null, null, null, 2.66, '7–15 dias', ''),
        v(80407, '70cm','Aço galv.','', null, null, null, 2.79, '7–15 dias', ''),
        v(80408, '80cm','Aço galv.','', null, null, null, 2.92, '7–15 dias', ''),
        v(80409, '90cm','Aço galv.','', null, null, null, 3.06, '7–15 dias', ''),
        v(80410,'100cm','Aço galv.','', null, null, null, 3.19, '7–15 dias', ''),
        v(80411,'150cm','Aço galv.','', null, null, null, 3.25, '7–15 dias', ''),
      ]},
      { id: 805, nome: 'Zlock 1 — Aço Inox', variacoes: [
        v(80501,'15cm','Aço inox','', null, null, null, 1.59, '—', ''),
        v(80502,'20cm','Aço inox','', null, null, null, 1.69, '—', ''),
        v(80503,'30cm','Aço inox','', null, null, null, 2.12, '—', ''),
        v(80504,'40cm','Aço inox','', null, null, null, 2.22, '—', ''),
      ]},
      { id: 806, nome: 'Zajust — Aço Inox', variacoes: [
        v(80601,'30cm','Aço inox','', null, null, null, 2.79, '—', ''),
        v(80602,'50cm','Aço inox','', null, null, null, 2.42, '—', ''),
        v(80603,'80cm','Aço inox','', null, null, null, 3.96, '—', ''),
      ]},
      { id: 807, nome: 'Zlock Mini (7–15 dias)', variacoes: [
        v(80701, '25cm','Aço','', null, null, null, 1.57, '7–15 dias', ''),
        v(80702, '30cm','Aço','', null, null, null, 1.61, '7–15 dias', ''),
        v(80703, '40cm','Aço','', null, null, null, 1.79, '7–15 dias', ''),
        v(80704, '60cm','Aço','', null, null, null, 1.98, '7–15 dias', ''),
        v(80705, '80cm','Aço','', null, null, null, 2.30, '7–15 dias', ''),
        v(80706,'100cm','Aço','', null, null, null, 2.49, '7–15 dias', ''),
        v(80707,'150cm','Aço','', null, null, null, 3.06, '7–15 dias', 'Personalização nas 2 faces +R$0,16'),
        v(80708,'160cm','Aço','', null, null, null, 3.25, '7–15 dias', ''),
        v(80709,'200cm','Aço','', null, null, null, 4.07, '7–15 dias', ''),
      ]},
      { id: 808, nome: 'Zlock Inox / AISI 304', variacoes: [
        v(80801,'30cm','Aço inox AISI 304','', null, null, null, 2.59, '—', ''),
      ]},
      { id: 809, nome: 'Zlock 3', variacoes: [
        v(80901,'27cm','Flandres','', null, null, null, 1.41, '30–40 dias', 'Mín. 1.000 pçs · Gravação a laser'),
      ]},
      { id: 810, nome: 'Alicate Corte Zlock e Zajust', variacoes: [
        v(81001,'Único','Aço','', null, null, null, 63.00, '3 dias', ''),
      ]},
      { id: 811, nome: 'Lacre de Chumbo / Sinete', variacoes: [
        v(81101,'10mm diâm.','Chumbo','', null, null, null, null, '3–5 dias', 'Rendimento 250 pçs/kg — R$136,00/kg'),
        v(81102,'12mm diâm.','Chumbo','', null, null, null, null, '3–5 dias', 'Rendimento 200 pçs/kg — R$136,00/kg'),
        v(81103,'14mm diâm.','Chumbo','', null, null, null, null, '3–5 dias', 'Rendimento 160 pçs/kg — R$136,00/kg'),
        v(81104,'16mm diâm.','Chumbo','', null, null, null, null, '3–5 dias', 'Rendimento 107 pçs/kg — R$136,00/kg'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     9. ABRAÇADEIRAS NACIONAL
  ══════════════════════════════════════════════════════ */
  {
    id: 9, categoria: 'Abraçadeiras Nacional', icon: 'layers', color: 'blue',
    obs: 'Preços por milheiro. Pacotes de 100 peças. Prazo 3–5 dias. Coloridas UV somente sob consulta.',
    produtos: [
      { id: 901, nome: 'Abraçadeira Nacional Padrão', variacoes: [
        v(90101,'2,5mm x 100mm','Nylon','Branca/Preta',       null, null,    39.00, null, '3–5 dias', ''),
        v(90102,'2,5mm x 100mm','Nylon','Amr/Vd/Az/Vm',       null, null,    52.00, null, '3–5 dias', ''),
        v(90103,'2,5mm x 140mm','Nylon','Branca/Preta',        null, null,    78.00, null, '3–5 dias', ''),
        v(90104,'2,5mm x 200mm','Nylon','Branca/Preta',        null, null,   105.00, null, '3–5 dias', ''),
        v(90105,'2,5mm x 200mm','Nylon','Amr/Vd/Az/Vm',        null, null,   108.00, null, '3–5 dias', ''),
        v(90106,'3,6mm x 150mm','Nylon','Branca/Preta',        null, null,    97.00, null, '3–5 dias', ''),
        v(90107,'3,6mm x 150mm','Nylon','Amr/Vd/Az/Vm',        null, null,   119.00, null, '3–5 dias', ''),
        v(90108,'3,6mm x 200mm','Nylon','Branca/Preta',        null, null,   123.00, null, '3–5 dias', ''),
        v(90109,'3,6mm x 200mm','Nylon','Amr/Vd/Az/Vm',        null, null,   146.00, null, '3–5 dias', ''),
        v(90110,'3,6mm x 300mm','Nylon','Branca/Preta',        null, null,   233.00, null, '3–5 dias', ''),
        v(90111,'3,6mm x 300mm','Nylon','Amr/Vd/Az/Vm',        null, null,   240.00, null, '3–5 dias', ''),
        v(90112,'4,8mm x 200mm','Nylon','Branca/Preta',        null, null,   150.00, null, '3–5 dias', ''),
        v(90113,'4,8mm x 200mm','Nylon','Amr/Vd/Az/Vm',        null, null,   179.00, null, '3–5 dias', ''),
        v(90114,'4,8mm x 230mm','Nylon','Branca/Preta',        null, null,   168.00, null, '3–5 dias', ''),
        v(90115,'4,8mm x 250mm','Nylon','Branca/Preta',        null, null,   206.00, null, '3–5 dias', ''),
        v(90116,'4,8mm x 280mm','Nylon','Branca/Preta',        null, null,   218.00, null, '3–5 dias', ''),
        v(90117,'4,8mm x 300mm','Nylon','Branca/Preta',        null, null,   271.00, null, '3–5 dias', ''),
        v(90118,'4,8mm x 390mm','Nylon','Branca/Preta',        null, null,   362.00, null, '3–5 dias', ''),
        v(90119,'7,5mm x 230mm','Nylon','Branca/Preta',        null, null,   638.00, null, '3–5 dias', ''),
        v(90120,'7,6mm x 380mm','Nylon','Branca/Preta',        null, null,   709.00, null, '3–5 dias', ''),
        v(90121,'9,0mm x 535mm','Nylon','Branca/Preta',        null, null,  2861.00, null, '3–5 dias', ''),
        v(90122,'9,0mm x 1020mm','Nylon','Branca/Preta',       null, null,  5354.00, null, '3–5 dias', ''),
        v(90123,'13mm x 350mm', 'Nylon','Branca/Preta',        null, null,  1911.00, null, '3–5 dias', ''),
        v(90124,'13mm x 540mm', 'Nylon','Branca/Preta',        null, null,  1970.00, null, '3–5 dias', ''),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     10. ABRAÇADEIRAS PROMOCIONAL
  ══════════════════════════════════════════════════════ */
  {
    id: 10, categoria: 'Abraçadeiras Promocional (UV)', icon: 'layers', color: 'green',
    obs: 'Todas com proteção UV. Prazo 5–7 dias.',
    produtos: [
      { id: 1001, nome: 'Abraçadeira Promocional UV', variacoes: [
        v(100101,'2,5mm x 100mm', 'Nylon UV','Branca/Preta', null, null,    32.00, null, '5–7 dias', ''),
        v(100102,'2,5mm x 150mm', 'Nylon UV','Branca/Preta', null, null,    50.00, null, '5–7 dias', ''),
        v(100103,'2,5mm x 200mm', 'Nylon UV','Branca/Preta', null, null,    55.00, null, '5–7 dias', ''),
        v(100104,'2,5mm x 300mm', 'Nylon UV','Branca/Preta', null, null,    87.00, null, '5–7 dias', ''),
        v(100105,'3,6mm x 150mm', 'Nylon UV','Branca/Preta', null, null,    65.00, null, '5–7 dias', ''),
        v(100106,'3,6mm x 200mm', 'Nylon UV','Branca/Preta', null, null,    89.00, null, '5–7 dias', ''),
        v(100107,'3,6mm x 250mm', 'Nylon UV','Branca/Preta', null, null,    98.00, null, '5–7 dias', ''),
        v(100108,'3,6mm x 300mm', 'Nylon UV','Branca',       null, null,   139.00, null, '5–7 dias', ''),
        v(100109,'4,8mm x 200mm', 'Nylon UV','Branca/Preta', null, null,   109.00, null, '5–7 dias', ''),
        v(100110,'4,8mm x 300mm', 'Nylon UV','Preta',        null, null,   169.00, null, '5–7 dias', ''),
        v(100111,'4,8mm x 350mm', 'Nylon UV','Branca/Preta', null, null,   205.00, null, '5–7 dias', ''),
        v(100112,'4,8mm x 400mm', 'Nylon UV','Preta',        null, null,   249.00, null, '5–7 dias', ''),
        v(100113,'4,8mm x 450mm', 'Nylon UV','Preta',        null, null,   265.00, null, '5–7 dias', ''),
        v(100114,'4,8mm x 500mm', 'Nylon UV','Preta',        null, null,   242.00, null, '5–7 dias', ''),
        v(100115,'7,2mm x 200mm', 'Nylon UV','Branca/Preta', null, null,   289.00, null, '5–7 dias', ''),
        v(100116,'7,2mm x 300mm', 'Nylon UV','Branca/Preta', null, null,   374.00, null, '5–7 dias', ''),
        v(100117,'7,2mm x 350mm', 'Nylon UV','Branca/Preta', null, null,   405.00, null, '5–7 dias', ''),
        v(100118,'7,6mm x 400mm', 'Nylon UV','Branca/Preta', null, null,   415.00, null, '5–7 dias', ''),
        v(100119,'7,6mm x 500mm', 'Nylon UV','Branca/Preta', null, null,   445.00, null, '5–7 dias', ''),
        v(100120,'8,8mm x 450mm', 'Nylon UV','Branca/Preta', null, null,   945.00, null, '5–7 dias', ''),
        v(100121,'9,0mm x 400mm', 'Nylon UV','Branca',       null, null,  1319.00, null, '5–7 dias', ''),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     11. ABRAÇADEIRAS ESPECIAIS
  ══════════════════════════════════════════════════════ */
  {
    id: 11, categoria: 'Abraçadeiras Especiais', icon: 'shield', color: 'indigo',
    obs: '',
    produtos: [
      { id: 1101, nome: 'Abraçadeira Identificável (ZID)', variacoes: [
        v(110101,'2,5mm x 100mm Branca','Nylon','Branca', null, null,  241.00, null, '5–7 dias', ''),
        v(110102,'2,5mm x 110mm Branca','Nylon','Branca', null, null,  675.00, null, '5–7 dias', ''),
        v(110103,'75mm / 125mm',        'Nylon','Branca', null, null,   33.00, null, '5–7 dias', 'Caixa com 5.000 unid'),
      ]},
      { id: 1102, nome: 'Abraçadeira Inox', variacoes: [
        v(110201,'150x4,6mm','Aço inox','', null, null,  218.00, null, '—', ''),
        v(110202,'200x4,6mm','Aço inox','', null, null,  238.00, null, '—', ''),
        v(110203,'250x4,6mm','Aço inox','', null, null,  258.00, null, '—', ''),
        v(110204,'300x4,6mm','Aço inox','', null, null,  278.00, null, '—', ''),
        v(110205,'400x4,6mm','Aço inox','', null, null,  358.00, null, '—', ''),
        v(110206,'150x8mm',  'Aço inox','', null, null,  378.00, null, '—', ''),
        v(110207,'200x8mm',  'Aço inox','', null, null,  418.00, null, '—', ''),
        v(110208,'250x8mm',  'Aço inox','', null, null,  458.00, null, '—', ''),
        v(110209,'300x8mm',  'Aço inox','', null, null,  498.00, null, '—', ''),
        v(110210,'400x8mm',  'Aço inox','', null, null,  598.00, null, '—', ''),
        v(110211,'200x10mm', 'Aço inox','', null, null,  538.00, null, '—', ''),
        v(110212,'300x10mm', 'Aço inox','', null, null,  558.00, null, '—', ''),
        v(110213,'400x10mm', 'Aço inox','', null, null,  758.00, null, '—', ''),
      ]},
      { id: 1103, nome: 'Abraçadeira Reutilizável', variacoes: [
        v(110301,'7,6mm x 150mm Branca','Nylon','Branca', null, null, 649.00, null, '—', ''),
        v(110302,'7,6mm x 250mm Branca','Nylon','Branca', null, null, 849.00, null, '—', ''),
      ]},
      { id: 1104, nome: 'Zpin', variacoes: [
        v(110401,'25mm','PP','', null, null, 17.00, null, '—', 'Vem 5.000 na caixa'),
        v(110402,'40mm','PP','', null, null, 17.00, null, '—', 'Vem 5.000 na caixa'),
      ]},
      { id: 1105, nome: 'Fixador Autoadesivo para Fios', variacoes: [
        v(110501,'19x19mm','PP','Branca/Preta', null, null, 354.00, null, '—', 'Por milheiro'),
        v(110502,'30x30mm','PP','Branca/Preta', null, null, 544.00, null, '—', 'Por milheiro'),
      ]},
      { id: 1106, nome: 'Tubo Espiral', variacoes: [
        v(110601,'1/8" Branca', 'PE','', null, 1.80,  null, null, '—', 'por metro'),
        v(110602,'1/4" Branca', 'PE','', null, 1.99,  null, null, '—', 'por metro'),
        v(110603,'1/2" Branca', 'PE','', null, 4.65,  null, null, '—', 'por metro'),
        v(110604,'3/4" Branca', 'PE','', null, 7.99,  null, null, '—', 'por metro'),
        v(110605,'1"   Branca', 'PE','', null, 13.50, null, null, '—', 'por metro'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     12. CADEADOS
  ══════════════════════════════════════════════════════ */
  {
    id: 12, categoria: 'Cadeados', icon: 'lock', color: 'red',
    obs: 'Desconto somente acima de R$800,00 em compras. Prazo 15–20 dias para grandes quantidades.',
    produtos: [
      { id: 1201, nome: 'Cadeado Tradicional GOLD', variacoes: [
        v(120101,'20mm','Latão','', null, 16.90,  null, null, '15–20 dias', ''),
        v(120102,'25mm','Latão','', null, 19.90,  null, null, '15–20 dias', ''),
        v(120103,'30mm','Latão','', null, 23.50,  null, null, '15–20 dias', ''),
        v(120104,'35mm','Latão','', null, 29.90,  null, null, '15–20 dias', ''),
        v(120105,'40mm','Latão','', null, 37.50,  null, null, '15–20 dias', ''),
        v(120106,'45mm','Latão','', null, 44.90,  null, null, '15–20 dias', ''),
        v(120107,'50mm','Latão','', null, 48.50,  null, null, '15–20 dias', ''),
        v(120108,'60mm','Latão','', null, 79.90,  null, null, '15–20 dias', ''),
        v(120109,'70mm','Latão','', null, 103.90, null, null, '15–20 dias', ''),
      ]},
      { id: 1202, nome: 'Cadeado Tradicional PAPAIZ', variacoes: [
        v(120201,'50mm','Latão','', null, 54.50, null, null, '15–20 dias', ''),
      ]},
      { id: 1203, nome: 'Cadeado Colorido PAPAIZ / STAM', variacoes: [
        v(120301,'23mm','Liga','AM/AZ/BR/Cromado/PT/Rosa/VD/VM', null, 52.50, null, null, '—', 'Consultar disponibilidade de cor'),
        v(120302,'25mm','Latão','Em estoque',                     null, 23.50, null, null, '—', 'Temos em estoque'),
        v(120303,'40mm','Liga','Sob consulta',                    null, 46.90, null, null, '—', ''),
      ]},
      { id: 1204, nome: 'Segredo Numérico GOLD / PAPAIZ', variacoes: [
        v(120401,'20mm','Zinco','', null, 21.00, null, null, '—', 'Gold 12 pçs mín · Papaiz R$20,30'),
        v(120402,'25mm','Zinco','', null, 24.50, null, null, '—', 'Gold 10 pçs mín · Papaiz R$24,50'),
        v(120403,'30mm','Zinco','', null, 27.90, null, null, '—', 'Gold 10 pçs mín · Papaiz R$24,50'),
        v(120404,'35mm','Zinco','', null, 36.50, null, null, '—', 'Gold 5 pçs mín  · Papaiz R$32,00'),
        v(120405,'40mm','Zinco','', null, 46.50, null, null, '—', 'Gold 5 pçs mín  · Papaiz R$44,50'),
      ]},
      { id: 1205, nome: 'Segredo Igual Tetra PAPAIZ', variacoes: [
        v(120501,'50mm','Aço','', null, 189.00, null, null, '—', ''),
        v(120502,'60mm','Aço','', null, 215.00, null, null, '—', ''),
        v(120503,'70mm','Aço','', null, 256.00, null, null, '—', ''),
      ]},
      { id: 1206, nome: 'Cadeado Bloqueio', variacoes: [
        v(120601,'25mm','Nylon+Aço','', null,  47.00, null, null, '—', ''),
        v(120602,'38mm','Nylon+Aço','', null,  48.00, null, null, '—', ''),
        v(120603,'50mm','Nylon+Aço','', null,  53.00, null, null, '—', ''),
        v(120604,'35/50mm (haste longa)','Nylon+Aço','', null, null, null, null, '—', 'Sob consulta'),
      ]},
      { id: 1207, nome: 'Haste Média e Longa Colorido', variacoes: [
        v(120701,'25–75mm / vários','Liga','AM/AZ/VD/VM', null, null, null, null, '—', 'Sob consulta — PADO / PAPAIZ / STAM'),
      ]},
      { id: 1208, nome: 'Corrente para Cadeado', variacoes: [
        v(120801,'Único','Aço','', null, 6.90, null, null, '—', 'por unidade'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     13. MÁQUINAS E ACESSÓRIOS
  ══════════════════════════════════════════════════════ */
  {
    id: 13, categoria: 'Máquinas e Acessórios', icon: 'wrench', color: 'emerald',
    obs: 'Prazo 2–7 dias. Outros modelos de máquina lacradora ou seladora — sob consulta.',
    produtos: [
      { id: 1301, nome: 'Máquina Lacradora Redonda', variacoes: [
        v(130101,'Única','','Vermelha (disponível)', null, 109.00, null, null, '2–7 dias', 'No momento R$114,00 — disponível somente na cor vermelha'),
      ]},
      { id: 1302, nome: 'Máquina Lacradora Quadrada', variacoes: [
        v(130201,'Única','','', null, 59.90, null, null, '2–7 dias', ''),
      ]},
      { id: 1303, nome: 'Máquina de Selar', variacoes: [
        v(130301,'20cm','','', null,  339.00, null, null, '2–7 dias', ''),
        v(130302,'30cm','','', null,  416.00, null, null, '2–7 dias', 'Outras medidas sob consulta'),
      ]},
      { id: 1304, nome: 'Refil para Máquina Selar 20cm', variacoes: [
        v(130401,'20cm','','', null, 33.60, null, null, '2–7 dias', 'Outras medidas sob consulta'),
      ]},
      { id: 1305, nome: 'Fita para Máquina Lacradora / Selar', variacoes: [
        v(130501,'12mm x 80m','','', null, 3.29, null, null, '2–7 dias', 'por unidade'),
      ]},
      { id: 1306, nome: 'Placas de Identificação / Etiqueta de Patrimônio', variacoes: [
        v(130601,'Sob medida','Alumínio / Inox','', null, null, null, null, '15–20 dias', 'Preço sob consulta — personalizadas'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     14. FITAS
  ══════════════════════════════════════════════════════ */
  {
    id: 14, categoria: 'Fitas', icon: 'scissors', color: 'rose',
    obs: 'Prazo 3–7 dias. Outras medidas sob consulta.',
    produtos: [
      { id: 1401, nome: 'Fita Isolante Antichama', variacoes: [
        v(140101,'5m', 'PVC','Preta', null, 1.36, null, null, '3–7 dias', ''),
        v(140102,'10m','PVC','Preta', null, 2.30, null, null, '3–7 dias', ''),
      ]},
      { id: 1402, nome: 'Fita Zebrada para Sinalização', variacoes: [
        v(140201,'7cm x 100m','PE','Preta/Amarela', null, 12.00, null, null, '3–7 dias', ''),
        v(140202,'7cm x 150m','PE','Preta/Amarela', null, 13.00, null, null, '3–7 dias', ''),
      ]},
      { id: 1403, nome: 'Fita Dupla Face', variacoes: [
        v(140301,'24mm x 10m', '','', null,  8.33, null, null, '3–7 dias', 'por unidade'),
        v(140302,'48mm x 10m', '','', null, 15.00, null, null, '3–7 dias', 'por unidade'),
        v(140303,'24mm x 20m', '','', null, 15.99, null, null, '3–7 dias', 'por unidade'),
      ]},
      { id: 1404, nome: 'Fita Adesiva', variacoes: [
        v(140401,'45mm x 100m','BOPP','Marrom/Transparente', null, 7.90, null, null, '3–7 dias', 'por unidade'),
        v(140402,'48mm x 45m', 'BOPP','Marrom/Transparente', null, 4.80, null, null, '3–7 dias', 'por unidade'),
      ]},
      { id: 1405, nome: 'Fita de Demarcação de Solo', variacoes: [
        v(140501,'48mm x 30m','PE','Amarela/Azul/Vermelha', null, 39.00, null, null, '3–7 dias', 'por unidade'),
      ]},
      { id: 1406, nome: 'Fita Silver Tape', variacoes: [
        v(140601,'48mm x 50m','PE','Prata', null, 75.00, null, null, '3–7 dias', 'por rolo'),
      ]},
      { id: 1407, nome: 'Fita Crepe', variacoes: [
        v(140701,'18mm x 50m','Papel','', null,  6.90, null, null, '3–7 dias', 'por unidade'),
        v(140702,'24mm x 50m','Papel','', null,  9.92, null, null, '3–7 dias', 'por unidade'),
        v(140703,'45mm x 50m','Papel','', null, 11.20, null, null, '3–7 dias', 'por unidade'),
      ]},
      { id: 1408, nome: 'Suporte para Fita Adesiva (embalagens)', variacoes: [
        v(140801,'Universal','','', null, 49.00, null, null, '3–7 dias', 'por unidade'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     15. FITILHO / RAFIA
  ══════════════════════════════════════════════════════ */
  {
    id: 15, categoria: 'Fitilho / Rafia', icon: 'archive', color: 'lime',
    obs: '',
    produtos: [
      { id: 1501, nome: 'Fitilho Torcido Grosso Cinza — Rolo', variacoes: [
        v(150101,'Rolo 7kg ~500m','PP','Cinza', null, null, null, null, '—', 'R$274,00/rolo · acima de 15 rolos R$139,00/rolo'),
      ]},
      { id: 1502, nome: 'Fitilho de Rafia Médio Cinza — Rolo', variacoes: [
        v(150201,'Rolo ~7kg','Rafia','Cinza', null, null, null, null, '—', 'R$11,20 por kg / 500 metros'),
      ]},
      { id: 1503, nome: 'Fitilho Macio Fino Branco — Rolo', variacoes: [
        v(150301,'Rolo 182m','PP','Branco', null, 19.99, null, null, '—', ''),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     16. MALOTES E BOLSAS
  ══════════════════════════════════════════════════════ */
  {
    id: 16, categoria: 'Malotes e Bolsas', icon: 'briefcase', color: 'violet',
    obs: 'Prazo 15–20 dias (malotes) / 20–30 dias (bolsas). Personalização +R$2,00/peça/cor (máx. 2 cores, mín. 10 pçs). Sem degradê. Tecidos Nylon e Emborrachado são impermeáveis.',
    produtos: [
      { id: 1601, nome: 'Malote Correio', variacoes: [
        v(160101,'30x25x10cm', 'Courino','', null,  59.00, null, null, '15–20 dias', ''),
        v(160102,'40x30x10cm', 'Courino','', null,  69.00, null, null, '15–20 dias', ''),
        v(160103,'47x34x14cm', 'Courino','', null,  89.00, null, null, '15–20 dias', ''),
        v(160104,'60x40x15cm', 'Courino','', null, 109.00, null, null, '15–20 dias', ''),
        v(160105,'60x45x18cm', 'Courino','', null, 119.00, null, null, '15–20 dias', ''),
        v(160106,'70x50x25cm', 'Courino','', null, 129.00, null, null, '15–20 dias', ''),
      ]},
      { id: 1602, nome: 'Pasta Nylon / Emborrachada', variacoes: [
        v(160201,'40x35x8cm','Nylon/Emborrachado','', null, 23.00, null, null, '15–20 dias', 'Impermeável'),
        v(160202,'30x40cm',  'Nylon/Emborrachado','', null, 21.00, null, null, '15–20 dias', 'Impermeável'),
        v(160203,'15x20cm',  'Nylon/Emborrachado','', null, 19.00, null, null, '15–20 dias', 'Impermeável'),
      ]},
      { id: 1603, nome: 'Pasta Lona', variacoes: [
        v(160301,'40x35x8cm','Lona','', null, 26.00, null, null, '15–20 dias', ''),
        v(160302,'30x40cm',  'Lona','', null, 23.00, null, null, '15–20 dias', ''),
      ]},
      { id: 1604, nome: 'Malote Urna com Boca de Papelão', variacoes: [
        v(160401,'50x25x25cm Lona','Lona','', null, 102.00, null, null, '20–30 dias', 'Personalização bordado a partir de 30 pçs'),
      ]},
      { id: 1605, nome: 'Porta Sacola Supermercado', variacoes: [
        v(160501,'Único','Lona','', null, 44.00, null, null, '20–30 dias', 'Somente vender o que tiver em estoque · Cima: 8x40x24cm · Baixo: 8x51x24cm'),
      ]},
      { id: 1606, nome: 'Pochete Nylon 600', variacoes: [
        v(160601,'Princ. 12x23x7cm · Bolso 8,5x13,5x3cm','Nylon 600','', null, 29.00, null, null, '20–30 dias', 'Lisa · Alça cinto regulável 2,5cm · Fecho aranha · Zíper nº6'),
      ]},
      { id: 1607, nome: 'Bolsa Térmica 5 Litros', variacoes: [
        v(160701,'5 litros','Nylon','', null, 59.00, null, null, '20–30 dias', 'Lisa'),
      ]},
    ],
  },
  /* ══════════════════════════════════════════════════════
     17. ETIQUETAS E OUTROS
  ══════════════════════════════════════════════════════ */
  {
    id: 17, categoria: 'Etiquetas e Outros', icon: 'star', color: 'fuchsia',
    obs: '',
    produtos: [
      { id: 1701, nome: 'Etiqueta Adesiva Couche 34x23mm', variacoes: [
        v(170101,'1.900 etiq./rolo · mín. 5 rolos', 'Papel couche','', null, 135.00, null, null, '—', ''),
        v(170102,'1.900 etiq./rolo · mín. 10 rolos','Papel couche','', null, 109.00, null, null, '—', ''),
      ]},
      { id: 1702, nome: 'Dispenser de Senha', variacoes: [
        v(170201,'Único','','', null, null, null, null, '—', 'Sob consulta'),
      ]},
      { id: 1703, nome: 'Rolo de Senha', variacoes: [
        v(170301,'Único','','', null, 82.00, null, null, '—', ''),
      ]},
      { id: 1704, nome: 'Lacre Etiqueta', variacoes: [
        v(170401,'Único','','', null, null, null, null, '—', 'Sob consulta'),
      ]},
    ],
  },
];

// ── POLÍTICA DE PARCELAS ──────────────────────────────────────────────────
const PARCELAS = [
  { label: '1x – 2x', desc: 'sem acréscimo', faixa: 'R$500 a R$5.000', color: 'bg-green-100 text-green-800' },
  { label: '3x',      desc: '+2,75%',         faixa: 'R$5.000 a R$10.000', color: 'bg-yellow-100 text-yellow-800' },
  { label: '4x',      desc: '+3,48%',         faixa: 'R$10.000 a R$20.000', color: 'bg-orange-100 text-orange-800' },
];

// ── PALETA ────────────────────────────────────────────────────────────────
const PALETA = {
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200',  badge: 'bg-purple-600'  },
  cyan:    { bg: 'bg-cyan-100',    text: 'text-cyan-700',    border: 'border-cyan-200',    badge: 'bg-cyan-600'    },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-700',    border: 'border-pink-200',    badge: 'bg-pink-600'    },
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200',  badge: 'bg-orange-600'  },
  yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-200',  badge: 'bg-yellow-600'  },
  teal:    { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200',    badge: 'bg-teal-600'    },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-600'   },
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',   badge: 'bg-slate-600'   },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    badge: 'bg-blue-600'    },
  green:   { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200',   badge: 'bg-green-600'   },
  indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-700',  border: 'border-indigo-200',  badge: 'bg-indigo-600'  },
  red:     { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     badge: 'bg-red-600'     },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-600' },
  rose:    { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    badge: 'bg-rose-600'    },
  lime:    { bg: 'bg-lime-100',    text: 'text-lime-700',    border: 'border-lime-200',    badge: 'bg-lime-600'    },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200',  badge: 'bg-violet-600'  },
  fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', badge: 'bg-fuchsia-600' },
};

// ── Init localStorage ──────────────────────────────────────────────────────
function initCatalogo() {
  const ver = localStorage.getItem(CAT_VER_KEY);
  if (ver !== CAT_VERSION) {
    localStorage.setItem(CAT_KEY, JSON.stringify(CATALOGO_SEED));
    localStorage.setItem(CAT_VER_KEY, CAT_VERSION);
    return JSON.parse(JSON.stringify(CATALOGO_SEED));
  }
  try { return JSON.parse(localStorage.getItem(CAT_KEY)) ?? CATALOGO_SEED; }
  catch { return JSON.parse(JSON.stringify(CATALOGO_SEED)); }
}
function saveCatalogo(data) { localStorage.setItem(CAT_KEY, JSON.stringify(data)); }

const VAZIO_CAT  = { categoria: '' };
const VAZIO_PROD = { nome: '' };
const VAZIO_VAR  = { tamanho:'', material:'', precoAtacado:'', precoMilheiro:'', precoUnidade:'', prazo:'', obs:'' };

const CAMPOS_PRECO = [
  { key:'precoAtacado',  label:'Atacado',   cls:'text-emerald-700 font-bold' },
  { key:'precoMilheiro', label:'/Milheiro', cls:'text-purple-700 font-bold'  },
  { key:'precoUnidade',  label:'/Unidade',  cls:'text-orange-700 font-bold'  },
];

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function Precos() {
  const { can } = useAuth();
  const [catalogo, setCatalogo]   = useState(initCatalogo);
  const [busca, setBusca]         = useState('');
  const [filtroCat, setFiltroCat] = useState('');
  const [abertos, setAbertos]     = useState(() => {
    const m = {};
    CATALOGO_SEED.forEach(c => { m[c.id] = false; });
    return m;
  });

  // Modais
  const [modalCat,  setModalCat]  = useState(null);
  const [modalProd, setModalProd] = useState(null);
  const [modalVar,  setModalVar]  = useState(null);
  const [modalDel,  setModalDel]  = useState(null);
  const [formCat,   setFormCat]   = useState(VAZIO_CAT);
  const [formProd,  setFormProd]  = useState(VAZIO_PROD);
  const [formVar,   setFormVar]   = useState(VAZIO_VAR);

  const persist = useCallback((novo) => { setCatalogo(novo); saveCatalogo(novo); }, []);

  const toggle = (key) => setAbertos(p => ({ ...p, [key]: !p[key] }));

  // Stats
  const { totalCats, totalVars, comPreco } = useMemo(() => {
    let tv = 0, cp = 0;
    catalogo.forEach(c => c.produtos.forEach(p => p.variacoes.forEach(vv => {
      tv++;
      if ([vv.precoAtacado, vv.precoMilheiro, vv.precoUnidade].some(x => x != null && x !== '')) cp++;
    })));
    return { totalCats: catalogo.length, totalVars: tv, comPreco: cp };
  }, [catalogo]);

  // Filtro
  const lista = useMemo(() => {
    const q = busca.toLowerCase();
    return catalogo
      .filter(c => !filtroCat || c.id === Number(filtroCat))
      .map(c => ({
        ...c,
        produtos: c.produtos.map(p => ({
          ...p,
          variacoes: q
            ? p.variacoes.filter(vv => (p.nome + vv.tamanho + vv.material + vv.obs).toLowerCase().includes(q))
            : p.variacoes,
        })).filter(p => {
          if (!q) return true;
          return p.nome.toLowerCase().includes(q) || p.variacoes.length > 0;
        }),
      })).filter(c => c.produtos.some(p => p.variacoes.length > 0 || !q));
  }, [catalogo, busca, filtroCat]);

  // CRUD Categoria
  const salvarCat = (e) => {
    e.preventDefault();
    if (modalCat.modo === 'novo') {
      persist([...catalogo, { id: nextId(catalogo), categoria: formCat.categoria, icon:'tag', color:'purple', obs:'', produtos:[] }]);
    } else {
      persist(catalogo.map(c => c.id === modalCat.dados.id ? { ...c, categoria: formCat.categoria } : c));
    }
    setModalCat(null);
  };

  // CRUD Produto
  const salvarProd = (e) => {
    e.preventDefault();
    persist(catalogo.map(c => {
      if (c.id !== modalProd.catId) return c;
      const prods = modalProd.modo === 'novo'
        ? [...c.produtos, { id: nextId(c.produtos), nome: formProd.nome, variacoes:[] }]
        : c.produtos.map(p => p.id === modalProd.dados.id ? { ...p, nome: formProd.nome } : p);
      return { ...c, produtos: prods };
    }));
    setModalProd(null);
  };

  // CRUD Variação
  const salvarVar = (e) => {
    e.preventDefault();
    const parseN = x => (x === '' || x == null) ? null : Number(x);
    const dv = { ...formVar, precoAtacado: parseN(formVar.precoAtacado), precoMilheiro: parseN(formVar.precoMilheiro), precoUnidade: parseN(formVar.precoUnidade) };
    persist(catalogo.map(c => {
      if (c.id !== modalVar.catId) return c;
      return { ...c, produtos: c.produtos.map(p => {
        if (p.id !== modalVar.prodId) return p;
        const vars = modalVar.modo === 'novo'
          ? [...p.variacoes, { id: nextId(p.variacoes), ...dv }]
          : p.variacoes.map(vv => vv.id === modalVar.dados.id ? { ...vv, ...dv } : vv);
        return { ...p, variacoes: vars };
      })};
    }));
    setModalVar(null);
  };

  // Excluir
  const confirmarDel = () => {
    const { tipo, catId, prodId, varId } = modalDel;
    let cats = catalogo;
    if (tipo === 'cat')  cats = cats.filter(c => c.id !== catId);
    if (tipo === 'prod') cats = cats.map(c => c.id !== catId ? c : { ...c, produtos: c.produtos.filter(p => p.id !== prodId) });
    if (tipo === 'var')  cats = cats.map(c => c.id !== catId ? c : { ...c, produtos: c.produtos.map(p => p.id !== prodId ? p : { ...p, variacoes: p.variacoes.filter(vv => vv.id !== varId) }) });
    persist(cats); setModalDel(null);
  };

  const abrirNovaVar   = (cId,pId)    => { setFormVar(VAZIO_VAR);    setModalVar({ modo:'novo',    catId:cId, prodId:pId }); };
  const abrirEditarVar = (cId,pId,vD) => { setFormVar({ ...vD, precoAtacado:vD.precoAtacado??'', precoMilheiro:vD.precoMilheiro??'', precoUnidade:vD.precoUnidade??'' }); setModalVar({ modo:'editar', catId:cId, prodId:pId, dados:vD }); };

  const pal = (color) => PALETA[color] ?? PALETA.purple;

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-purple-600" />
            Catálogo de Preços
            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-1">Tabela 12/2025</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {totalCats} categorias · {totalVars} SKUs ·{' '}
            <span className="font-semibold text-emerald-600">{comPreco} com preço</span> ·{' '}
            <span className="text-gray-400">{totalVars - comPreco} a consultar</span>
          </p>
        </div>
        {can.editarPrecos && (
          <button onClick={() => { setFormCat(VAZIO_CAT); setModalCat({ modo:'novo' }); }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold shadow transition text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nova Categoria
          </button>
        )}
      </div>

      {/* ── Info cartão e varejo ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/>Condições Cartão de Crédito</h3>
          <div className="flex flex-wrap gap-2">
            {PARCELAS.map(p => (
              <div key={p.label} className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${p.color}`}>
                <div className="font-bold">{p.label}</div>
                <div>{p.desc}</div>
                <div className="opacity-70 text-[10px]">{p.faixa}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <h3 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>Regras Comerciais</h3>
          <ul className="text-xs text-amber-800 space-y-1 leading-relaxed">
            <li>• <b>Varejo:</b> acrescentar 30% sobre materiais de estoque</li>
            <li>• Priorizar venda de material de estoque para saída rápida</li>
            <li>• <b>Laser:</b> priorizar cores claras</li>
            <li>• Gravação código de barras: somente <b>Amarelo</b> e <b>Branco</b></li>
            <li>• Trocas: até 30 dias (defeito fab.) · acima 90 dias sem troca</li>
          </ul>
        </div>
      </div>

      {!can.verPrecos && (
        <div className="bg-gray-100 rounded-2xl p-12 text-center text-gray-400">Sem acesso ao catálogo de preços.</div>
      )}

      {can.verPrecos && (
        <>
          {/* ── Filtros ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Buscar produto, tamanho..."
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
            {busca && (
              <button onClick={() => setBusca('')} className="text-xs text-gray-400 hover:text-gray-700 underline">Limpar</button>
            )}
          </div>

          {!can.editarPrecos && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4 text-blue-700 text-sm">
              <Info className="w-4 h-4 flex-shrink-0" />
              Modo <b>somente visualização</b>. Apenas Admin pode editar o catálogo.
            </div>
          )}

          {/* ── Acordeão de categorias ──────────────────────────────── */}
          <div className="space-y-3">
            {lista.map(cat => {
              const p = pal(cat.color);
              const totalSKUs = cat.produtos.reduce((s, pr) => s + pr.variacoes.length, 0);
              return (
                <div key={cat.id} className={`bg-white border-2 ${p.border} rounded-2xl shadow-sm overflow-hidden`}>

                  {/* Header categoria */}
                  <div
                    className={`flex items-center gap-3 px-5 py-4 cursor-pointer hover:${p.bg} transition select-none`}
                    onClick={() => toggle(cat.id)}
                  >
                    {abertos[cat.id]
                      ? <ChevronDown className={`w-5 h-5 ${p.text} flex-shrink-0`}/>
                      : <ChevronRight className={`w-5 h-5 ${p.text} flex-shrink-0`}/>}
                    <div className={`w-8 h-8 rounded-xl ${p.badge} text-white flex items-center justify-center flex-shrink-0`}>
                      <Tag className="w-4 h-4"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`font-extrabold text-gray-800 text-sm`}>{cat.categoria}</span>
                      {cat.obs && <p className="text-xs text-gray-400 truncate mt-0.5">{cat.obs}</p>}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.bg} ${p.text} flex-shrink-0`}>{totalSKUs} SKUs</span>
                    {can.editarPrecos && (
                      <div className="flex gap-1 ml-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setFormProd(VAZIO_PROD); setModalProd({ modo:'novo', catId:cat.id }); }}
                          className={`p-1.5 rounded-lg hover:${p.bg} ${p.text} transition`} title="Novo produto"><Plus className="w-3.5 h-3.5"/></button>
                        <button onClick={() => { setFormCat({ categoria:cat.categoria }); setModalCat({ modo:'editar', dados:cat }); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><Pencil className="w-3 h-3"/></button>
                        <button onClick={() => setModalDel({ tipo:'cat', catId:cat.id })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 className="w-3 h-3"/></button>
                      </div>
                    )}
                  </div>

                  {/* Produtos dentro da categoria */}
                  {abertos[cat.id] && (
                    <div className="border-t-2 border-dashed" style={{ borderColor: 'inherit' }}>
                      {cat.produtos.map(prod => (
                        <div key={prod.id} className="border-b last:border-b-0 border-gray-100">

                          {/* Header produto */}
                          <div
                            className="flex items-center gap-2 px-6 py-3 bg-gray-50/70 cursor-pointer hover:bg-gray-100 transition select-none"
                            onClick={() => toggle(`p${prod.id}`)}
                          >
                            {abertos[`p${prod.id}`]
                              ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                              : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0"/>}
                            <Package className={`w-4 h-4 ${p.text} flex-shrink-0`}/>
                            <span className="font-semibold text-gray-700 flex-1 text-sm">{prod.nome}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.bg} ${p.text} font-medium`}>
                              {prod.variacoes.length} var.
                            </span>
                            {can.editarPrecos && (
                              <div className="flex gap-1 ml-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => abrirNovaVar(cat.id, prod.id)}
                                  className={`p-1 rounded hover:${p.bg} ${p.text}`}><Plus className="w-3.5 h-3.5"/></button>
                                <button onClick={() => { setFormProd({ nome:prod.nome }); setModalProd({ modo:'editar', catId:cat.id, dados:prod }); }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-400"><Pencil className="w-3 h-3"/></button>
                                <button onClick={() => setModalDel({ tipo:'prod', catId:cat.id, prodId:prod.id })}
                                  className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3"/></button>
                              </div>
                            )}
                          </div>

                          {/* Tabela de variações */}
                          {abertos[`p${prod.id}`] && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className={`${p.bg} ${p.text}`}>
                                    <th className="px-4 py-2.5 text-left font-bold">Tamanho / Ref.</th>
                                    <th className="px-3 py-2.5 text-left font-bold">Material</th>
                                    <th className="px-3 py-2.5 text-right font-bold text-emerald-700">Atacado</th>
                                    <th className="px-3 py-2.5 text-right font-bold text-purple-700">/Milheiro</th>
                                    <th className="px-3 py-2.5 text-right font-bold text-orange-700">/Unidade</th>
                                    <th className="px-3 py-2.5 text-left font-bold">
                                      <Clock className="w-3 h-3 inline mr-1"/>Prazo
                                    </th>
                                    <th className="px-3 py-2.5 text-left font-bold">Observação</th>
                                    {can.editarPrecos && <th className="px-3 py-2.5 text-center font-bold">Ações</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {prod.variacoes.map((varD, idx) => {
                                    const temPreco = [varD.precoAtacado, varD.precoMilheiro, varD.precoUnidade].some(x => x != null && x !== '');
                                    return (
                                      <tr key={varD.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-purple-50/30 transition`}>
                                        <td className="px-4 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{varD.tamanho || '—'}</td>
                                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{varD.material || '—'}</td>
                                        <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                                          {brl(varD.precoAtacado) ? <span className="text-emerald-700">{brl(varD.precoAtacado)}</span> : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                                          {brl(varD.precoMilheiro) ? <span className="text-purple-700">{brl(varD.precoMilheiro)}</span> : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                                          {brl(varD.precoUnidade) ? <span className="text-orange-700">{brl(varD.precoUnidade)}</span> : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                          {varD.prazo && varD.prazo !== '—'
                                            ? <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{varD.prazo}</span>
                                            : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-400 max-w-xs truncate" title={varD.obs}>
                                          {varD.obs || <span className="text-gray-200">—</span>}
                                        </td>
                                        {can.editarPrecos && (
                                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                            <button onClick={() => abrirEditarVar(cat.id, prod.id, varD)}
                                              className={`p-1 rounded hover:${p.bg} ${p.text} mr-1`}><Pencil className="w-3 h-3"/></button>
                                            <button onClick={() => setModalDel({ tipo:'var', catId:cat.id, prodId:prod.id, varId:varD.id })}
                                              className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3"/></button>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                  {can.editarPrecos && (
                                    <tr>
                                      <td colSpan={can.editarPrecos ? 8 : 7} className="px-4 py-2">
                                        <button onClick={() => abrirNovaVar(cat.id, prod.id)}
                                          className={`flex items-center gap-1 ${p.text} hover:underline text-xs font-semibold`}>
                                          <Plus className="w-3 h-3"/> Adicionar variação
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
              );
            })}

            {lista.length === 0 && (
              <div className="text-center py-20 text-gray-300">
                <Search className="w-10 h-10 mx-auto mb-3"/>
                Nenhum resultado para "<strong className="text-gray-400">{busca}</strong>"
              </div>
            )}
          </div>
        </>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MODAIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Modal Categoria */}
      {modalCat && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold">{modalCat.modo==='novo'?'Nova Categoria':'Editar Categoria'}</h3>
              <button onClick={()=>setModalCat(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={salvarCat} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nome da Categoria *</label>
                <input required className="border rounded-xl px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  value={formCat.categoria} onChange={e=>setFormCat(f=>({...f,categoria:e.target.value}))}/>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition">Salvar</button>
                <button type="button" onClick={()=>setModalCat(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Produto */}
      {modalProd && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold">{modalProd.modo==='novo'?'Novo Produto':'Editar Produto'}</h3>
              <button onClick={()=>setModalProd(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={salvarProd} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nome do Produto *</label>
                <input required className="border rounded-xl px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  value={formProd.nome} onChange={e=>setFormProd(f=>({...f,nome:e.target.value}))}/>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition">Salvar</button>
                <button type="button" onClick={()=>setModalProd(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Variação */}
      {modalVar && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold">{modalVar.modo==='novo'?'Nova Variação':'Editar Variação'}</h3>
              <button onClick={()=>setModalVar(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={salvarVar} className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {[{key:'tamanho',label:'Tamanho',ph:'ex: 16mm, 30x40cm…'},{key:'material',label:'Material',ph:'ex: PP, Nylon…'},{key:'prazo',label:'Prazo',ph:'ex: 10–15 dias'}].map(f=>(
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                    <input className="border rounded-xl px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder={f.ph} value={formVar[f.key]} onChange={e=>setFormVar(fv=>({...fv,[f.key]:e.target.value}))}/>
                  </div>
                ))}
                {CAMPOS_PRECO.map(f=>(
                  <div key={f.key}>
                    <label className={`text-xs font-semibold ${f.cls}`}>{f.label} (R$)</label>
                    <input type="number" step="0.01" min="0"
                      className="border rounded-xl px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      placeholder="0,00" value={formVar[f.key]} onChange={e=>setFormVar(fv=>({...fv,[f.key]:e.target.value}))}/>
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Observação</label>
                  <input className="border rounded-xl px-3 py-2 w-full mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    value={formVar.obs} onChange={e=>setFormVar(fv=>({...fv,obs:e.target.value}))}/>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition">Salvar</button>
                <button type="button" onClick={()=>setModalVar(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {modalDel && can.editarPrecos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7 text-red-500"/>
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-lg">Confirmar Exclusão</h3>
            <p className="text-gray-400 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={confirmarDel} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition">Excluir</button>
              <button onClick={()=>setModalDel(null)} className="flex-1 border rounded-xl text-gray-600 hover:bg-gray-50 py-2.5">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
