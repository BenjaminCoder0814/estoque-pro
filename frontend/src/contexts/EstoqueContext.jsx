// Contexto global de dados do sistema de estoque
// Gerencia produtos, movimentações e auditoria no localStorage
import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '../services/apiClient';

const PRODUTOS_KEY = 'zkprodutos';
const MOV_KEY = 'zkmovimentacoes';
const AUDIT_KEY = 'zkauditoria';
const SEED_VERSION_KEY = 'zkSeedVersion';
const SEED_VERSION = 'v10'; // Incrementar aqui força reset do catálogo

const BASE_URL = import.meta.env.BASE_URL || '/';
function withBase(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith(BASE_URL)) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url.slice(1)}`;
  return `${BASE_URL}${url}`;
}

function normalizeProdutos(lista) {
  return (lista || []).map((p) => ({ ...p, imagem: withBase(p.imagem) }));
}

const now = new Date().toISOString();
const prod = (id, nome, codigo, categoria, estoqueAtual, estoqueMinimo, geraAlerta, imagem, modelo = '', tamanho = '', material = '', cor = '') => ({
  id, nome, codigo, categoria, estoqueAtual, estoqueMinimo, modelo, tamanho, material, cor,
  controlaEstoque: true, geraAlerta, ativo: true, imagem: withBase(imagem), criadoEm: now,
  ultimaAtualizacao: '', atualizadoPor: '',
});

const produtosIniciais = [
  // ── MATERIAIS NUMERADOS ESTOQUE 04/26 ──
  // 💠 ZNAN
  prod(1001, 'znan azul', '', 'ZNAN', 300, 0, true, ''),
  prod(1002, 'znan verde', '', 'ZNAN', 2100, 0, true, ''),
  prod(1003, 'znan amarelo', '', 'ZNAN', 1700, 0, true, ''),
  prod(1004, 'znan vermelho', '', 'ZNAN', 100, 0, true, ''),
  prod(1005, 'znan azul (rentank)', '', 'ZNAN', 0, 0, true, ''),
  prod(1006, 'znan policarbonato (estoque escasso)', '', 'ZNAN', 0, 0, true, ''),
  prod(1007, 'znan cerradinho verde e azul', '', 'ZNAN', 0, 0, true, ''),

  // 💠 DT
  prod(1010, 'dt 16 pp amarelo', '', 'DT', 1900, 0, true, ''),
  prod(1011, 'dt 16 pp cinza', '', 'DT', 500, 0, true, ''),
  prod(1012, 'dt 16 pp azul', '', 'DT', 4800, 0, true, ''),
  prod(1013, 'dt 16 pp branco', '', 'DT', 1900, 0, true, ''),
  prod(1014, 'dt 16 pp verde', '', 'DT', 1800, 0, true, ''),
  prod(1015, 'dt 16 pp vermelho (pata maior)', '', 'DT', 30700, 0, true, ''),
  prod(1016, 'dt 16 pp verde (pata maior)', '', 'DT', 9700, 0, true, ''),
  prod(1017, 'dt 16 pp laranja (pata maior)', '', 'DT', 14200, 0, true, ''),
  prod(1018, 'dt 16 pp preto (pata maior)', '', 'DT', 13700, 0, true, ''),
  prod(1019, 'dt 16 pp branco (código de barras)', '', 'DT', 5300, 0, true, ''),
  prod(1020, 'dt 23 pp verde', '', 'DT', 1900, 0, true, ''),
  prod(1021, 'dt 23 pp vermelho', '', 'DT', 9000, 0, true, ''),
  prod(1022, 'dt 31 pp azul', '', 'DT', 3000, 0, true, ''),
  prod(1023, 'dt 31 pp amarelo', '', 'DT', 1000, 0, true, ''),
  prod(1024, 'dt 41 pp azul', '', 'DT', 300, 0, true, ''),
  prod(1025, 'dt 41 pp laranja', '', 'DT', 1900, 0, true, ''),
  prod(1026, 'dt 41 pp verde', '', 'DT', 900, 0, true, ''),

  // 💠 ES
  prod(1030, 'es 16 ny branco', '', 'ES', 1900, 0, true, ''),
  prod(1031, 'es 16 ny amarelo', '', 'ES', 6700, 0, true, ''),
  prod(1032, 'es 16 ny laranja', '', 'ES', 1000, 0, true, ''),
  prod(1033, 'es 16 ny azul', '', 'ES', 1200, 0, true, ''),
  prod(1034, 'es 16 pp vermelho', '', 'ES', 4300, 0, true, ''),
  prod(1035, 'es 16 pp azul', '', 'ES', 2600, 0, true, ''),
  prod(1036, 'es 16 corte fácil azul', '', 'ES', 200, 0, true, ''),
  prod(1037, 'es 16 corte fácil amarelo', '', 'ES', 2500, 0, true, ''),
  prod(1038, 'es 23 ny azul', '', 'ES', 10300, 0, true, ''),
  prod(1039, 'es 23 ny laranja', '', 'ES', 3500, 0, true, ''),
  prod(1040, 'es 23 ny branco', '', 'ES', 1500, 0, true, ''),
  prod(1041, 'es 23 ny preto', '', 'ES', 1800, 0, true, ''),
  prod(1042, 'es 23 ny verde', '', 'ES', 1500, 0, true, ''),
  prod(1043, 'es 23 ny vermelho', '', 'ES', 1500, 0, true, ''),
  prod(1044, 'es 23 pp verde', '', 'ES', 2700, 0, true, ''),
  prod(1045, 'es 23 pp vermelho', '', 'ES', 2200, 0, true, ''),
  prod(1046, 'es 23 pp amarelo', '', 'ES', 500, 0, true, ''),
  prod(1047, 'es 23 pp azul', '', 'ES', 900, 0, true, ''),
  prod(1048, 'es 23 corte fácil amarelo', '', 'ES', 900, 0, true, ''),
  prod(1049, 'es 23 pp (código de barras)', '', 'ES', 4800, 0, true, ''),
  prod(1050, 'es 28 pp azul', '', 'ES', 500, 0, true, ''),
  prod(1051, 'es 28 pp amarelo', '', 'ES', 300, 0, true, ''),

  // 💠 EP
  prod(1060, 'ep 16 pe azul', '', 'EP', 2000, 0, true, ''),
  prod(1061, 'ep 23 pe azul', '', 'EP', 2700, 0, true, ''),
  // ...existing code...
  // Tradicionais Latão por tamanho (qtd confirmada nas anotações)
  prod(1,  'Cadeado Tradicional Latão 20mm',   'CAD-001', 'Cadeados',    100, 20, true,  '/imagens/cadeados/Cadeado Tradicional (latão).png'),
  prod(2,  'Cadeado Tradicional Latão 25mm',   'CAD-001B','Cadeados',     73, 10, true,  '/imagens/cadeados/Cadeado Tradicional (latão).png'),
  prod(3,  'Cadeado Tradicional Latão 30mm',   'CAD-001C','Cadeados',     17,  5, true,  '/imagens/cadeados/Cadeado Tradicional (latão).png'),
  prod(4,  'Cadeado Tradicional Latão 40mm',   'CAD-001D','Cadeados',      2,  2, true,  '/imagens/cadeados/Cadeado Tradicional (latão).png'),
  prod(5,  'Cadeado Tradicional Latão 50mm',   'CAD-001E','Cadeados',      1,  2, true,  '/imagens/cadeados/Cadeado Tradicional (latão).png'),
  prod(6,  'Cadeado Tradicional Latão 60mm',   'CAD-001F','Cadeados',      2,  2, true,  '/imagens/cadeados/Cadeado Tradicional (latão).png'),
  prod(7,  'Cadeado Tetra 30mm',               'CAD-002', 'Cadeados',     13,  5, true,  '/imagens/cadeados/Cadeado Tetra.png'),
  prod(8,  'Cadeado Haste Longa 35mm',         'CAD-003', 'Cadeados',     19,  5, true,  '/imagens/cadeados/Cadeado Haste Longa.png'),
  prod(9,  'Cadeado Colorido',                 'CAD-004', 'Cadeados',      0, 10, true,  '/imagens/cadeados/Cadeado Colorido.png'),
  prod(10, 'Cadeado Bloqueio',                 'CAD-005', 'Cadeados',      0,  5, true,  '/imagens/cadeados/Cadeado Bloqueio.png'),
  prod(11, 'Cadeado Segredo Igual',            'CAD-006', 'Cadeados',      0,  5, true,  '/imagens/cadeados/Cadeado segredo igual.png'),
  prod(12, 'Cadeado Segredo Numérico 25mm',    'CAD-007', 'Cadeados',      4,  5, true,  '/imagens/cadeados/Cadeado Segredo Numérico.png'),

  // ── ABRAÇADEIRAS ── (qtd não informada = 0)
  prod(13, 'Abraçadeira de Nylon Padrão',      'ABR-001', 'Abraçadeiras',  0, 50, true,  '/imagens/abracadeiras/Abraçadeira de Nylon — Padrão.png'),
  prod(14, 'Abraçadeira Identificável',        'ABR-002', 'Abraçadeiras',  0, 30, true,  '/imagens/abracadeiras/Abraçadeira Identificável.png'),
  prod(15, 'Abraçadeira Metálica',             'ABR-003', 'Abraçadeiras',  0, 20, true,  '/imagens/abracadeiras/Abraçadeira Metálica.png'),
  prod(16, 'ZFIX — Base Adesiva',             'ABR-004', 'Abraçadeiras',  0, 25, true,  '/imagens/abracadeiras/ZFIX — Base Adesiva.png'),

  // ── ARAMES ──
  prod(17, 'Amarrilho — Fecho de Arame',       'ARM-001', 'Arames',        0,100, true,  '/imagens/Arames/Amarrilho - Fecho de Arame (Twist Ties).png'),
  prod(18, 'Arame Galvanizado para Lacres',    'ARM-002', 'Arames',        6, 10, true,  '/imagens/Arames/Arame galvanizado para lacres (2 ou 3 fios).png'),
  prod(19, 'Fitilho Plástico para Amarração',  'ARM-003', 'Arames',        0, 80, true,  '/imagens/Arames/Fitilho plástico (PP) para amarração.png'),

  // ── FITAS ── (qtd confirmada ou 0)
  prod(20, 'Fita Adesiva 45x100',              'FIT-001', 'Fitas',        100, 20, true,  '/imagens/Fitas/Fita adesiva.png'),
  prod(21, 'Fita Crepe Média',                 'FIT-002', 'Fitas',         72, 12, true,  '/imagens/Fitas/Fita crepe.png'),
  prod(22, 'Fita Crepe Fina',                  'FIT-002F','Fitas',        233, 30, true,  '/imagens/Fitas/Fita crepe.png'),
  prod(23, 'Fita Crepe Grossa',                'FIT-002G','Fitas',         12,  5, true,  '/imagens/Fitas/Fita crepe.png'),
  prod(24, 'Fita Dupla Face',                  'FIT-003', 'Fitas',          0, 15, true,  '/imagens/Fitas/Fita dupla face.png'),
  prod(25, 'Fita Isolante Antichama',          'FIT-004', 'Fitas',          0, 10, true,  '/imagens/Fitas/Fita isolante antichama.png'),
  prod(26, 'Fita Isolante 5m',                 'FIT-005A','Fitas',        850, 100,true,  '/imagens/Fitas/Fita isolante.png'),
  prod(27, 'Fita Isolante 10m',                'FIT-005B','Fitas',        310,  50, true,  '/imagens/Fitas/Fita isolante.png'),
  prod(28, 'Fita para Máquina Lacradora Azul', 'FIT-006A','Fitas',         35,  5, true,  '/imagens/Fitas/Fita para máquina lacradora.png'),
  prod(29, 'Fita para Máquina Lacradora Verm.','FIT-006B','Fitas',          1,  2, true,  '/imagens/Fitas/Fita para máquina lacradora.png'),
  prod(30, 'Fita Silver Tape',                 'FIT-007', 'Fitas',          0, 12, true,  '/imagens/Fitas/Fita silver tape.png'),
  prod(31, 'Fita Zebrada',                     'FIT-008', 'Fitas',          5,  5, true,  '/imagens/Fitas/Fita zebrada.png'),
  prod(32, 'Fita Transparente',                'FIT-009T','Fitas',         50, 10, true,  '/imagens/Fitas/Fita adesiva.png'),
  prod(33, 'Fita Marrom',                      'FIT-009M','Fitas',        100, 15, true,  '/imagens/Fitas/Fita adesiva.png'),
  prod(34, 'Fita Branca',                      'FIT-009B','Fitas',         87, 15, true,  '/imagens/Fitas/Fita adesiva.png'),
  prod(35, 'Fita para Embalagem 19x19 Branca', 'FIT-010E','Fitas',       5100,500, true,  '/imagens/Fitas/Fita adesiva.png'),
  prod(36, 'Fita Personalizada',               'FIT-011', 'Fitas',          2,  1, true,  '/imagens/Fitas/Fita zebrada.png'),
  prod(37, 'Fita de Demarcação',               'FIT-012', 'Fitas',          1,  1, true,  '/imagens/Fitas/Fita zebrada.png'),
  prod(38, 'Lacre Etiqueta (rolo)',             'FIT-013', 'Fitas',          0, 50, true,  '/imagens/Fitas/Lacre etiqueta.png'),
  prod(39, 'Suporte para Fita Adesiva',        'FIT-014', 'Fitas',          0,  5, true,  '/imagens/Fitas/Suporte para fita adesiva.png'),

  // ── LACRES METÁLICOS ──
  prod(40, 'Lacre Metálico Amarelo',         'LMT-001', 'Lacres Metálicos',   0, 100, true,  '/imagens/lacres-metalicos/Amarelo 1.png'),
  prod(41, 'Lacre Metálico Azul',            'LMT-002', 'Lacres Metálicos',   0, 100, true,  '/imagens/lacres-metalicos/Azul 1.png'),
  prod(42, 'Lacre Metálico Vermelho',        'LMT-003', 'Lacres Metálicos',   0, 100, true,  '/imagens/lacres-metalicos/Vermelho 1.png'),
  prod(43, 'Lacre Chumbo Sinete',             'LMT-004', 'Lacres Metálicos',   0,  60, true,  '/imagens/lacres-metalicos/lacre-chumbo-sinete.png'),
  prod(44, 'Lacre Sextavado',                 'LMT-005', 'Lacres Metálicos',   0,  70, true,  '/imagens/lacres-metalicos/lacre-sextavado.png'),
  prod(45, 'Ajuste Caixa Ajustável',         'LMT-006', 'Lacres Metálicos',   0,  40, true,  '/imagens/lacres-metalicos/zajuste-caixa-ajustavel.png'),
  prod(46, 'Zlock 3 Folha Flandres',          'LMT-007', 'Lacres Metálicos',   0,  35, true,  '/imagens/lacres-metalicos/zlock-3-folha-flandres.png'),
  prod(47, 'Zlock Manivela',                  'LMT-008', 'Lacres Metálicos',   0,  30, true,  '/imagens/lacres-metalicos/zlock-manivela.png'),
  prod(48, 'Pino Bolt Seal',                  'LMT-009', 'Lacres Metálicos',   0,  50, true,  '/imagens/lacres-metalicos/zpino-bolt-seal.png'),

  // ── LACRES PLÁSTICOS ──
  prod(49, 'Lacre Âncora PP com rabicho',      'LPL-001A', 'Lacres Plásticos',   0, 150, true,  '/imagens/lacres-plasticos/lacre-ancora-com-rabicho.png'),
  prod(50, 'Lacre Âncora PP sem rabicho',      'LPL-001B', 'Lacres Plásticos',   0, 150, true,  '/imagens/lacres-plasticos/lacre-ancora-sem-rabicho.png'),
  prod(51, 'Lacre Âncora PP sem rabicho azul', 'LPL-001C', 'Lacres Plásticos',   0, 100, true,  '/imagens/lacres-plasticos/lacre-ancora-sem-rabicho-azul.png'),
  prod(52, 'Lacre Âncora PP com rabicho amarelo','LPL-001D', 'Lacres Plásticos', 0, 100, true,  '/imagens/lacres-plasticos/lacre-ancora-com-rabicho-amarelo.png'),
  prod(53, 'Lacre Âncora Policarbonato vermelho','LPL-001E', 'Lacres Plásticos', 0, 100, true,  '/imagens/lacres-plasticos/ancora.png'),
  prod(54, 'Anel Extintor',                    'LPL-002', 'Lacres Plásticos',   0, 100, true,  '/imagens/lacres-plasticos/anel-extintor.png'),
  prod(55, 'Aplicador para Lacre Sacola',      'LPL-003', 'Lacres Plásticos',   0,   3, true,  '/imagens/lacres-plasticos/aplicador-lacre-sacola.png'),
  prod(56, 'Dupla Trava DT',                   'LPL-004', 'Lacres Plásticos',   0, 200, true,  '/imagens/lacres-plasticos/dupla-trava-dt.png'),
  prod(57, 'Escada Alta ES',                   'LPL-005', 'Lacres Plásticos',   0, 150, true,  '/imagens/lacres-plasticos/escada-alta-es.png'),
  prod(58, 'Espinha de Peixe',                 'LPL-006', 'Lacres Plásticos',   0, 100, true,  '/imagens/lacres-plasticos/espinha-de-peixe.png'),
  prod(55, 'Lacre de Sacola — Zni',            'LPL-007', 'Lacres Plásticos',   0, 500, true,  '/imagens/lacres-plasticos/Lacre de Sacola — Zni.png'),
  prod(61, 'Znan Policarbonato',               'LPL-012', 'Lacres Plásticos',   0, 100, true,  '/imagens/lacres-plasticos/znan-policarbonato.png'),
  prod(62, 'Znan Sem Rabicho',                 'LPL-013', 'Lacres Plásticos',   0, 100, true,  '/imagens/lacres-plasticos/znan-sem-rabicho.png'),
  prod(63, 'Znan Com Rabicho',                 'LPL-014', 'Lacres Plásticos',   0, 100, true,  '/imagens/lacres-plasticos/znan-com-rabicho.png'),
  prod(56, 'Lacre para Caixas ALC',            'LPL-008', 'Lacres Plásticos',   0, 200, true,  '/imagens/lacres-plasticos/lacre-caixas-alc.png'),
  prod(57, 'Lacre Tag Autenticidade',          'LPL-009', 'Lacres Plásticos',  10,  50, true,  '/imagens/lacres-plasticos/lacre-tag-autenticidade.png'),
  prod(58, 'Lacre Pino Anel 25mm',             'LPL-009P','Lacres Plásticos',  17,  20, true,  '/imagens/lacres-plasticos/ancora.png'),
  prod(59, 'Trava Anel',                       'LPL-010', 'Lacres Plásticos',   0, 150, true,  '/imagens/lacres-plasticos/trava-anel.png'),
  prod(60, 'ZLS TM 35 — Trava Metálica',       'LPL-011', 'Lacres Plásticos',   0,  80, true,  '/imagens/lacres-plasticos/ZLS TM 35 — Trava Metálica (TM).png'),

  // ── MALOTES, PASTAS E BOLSAS ── (qtd confirmada nas anotações de 29/12/25)
  prod(61, 'Bolsa com Zíper (Sacola)',          'MPB-001', 'Malotes, Pastas e Bolsas',   0,  5, true,  '/imagens/malotes/Bolsa com Zíper (estilo Sacola).png'),
  prod(62, 'Porta Sacola Supermercado',         'MPB-004', 'Malotes, Pastas e Bolsas',   0, 10, true,  '/imagens/malotes/Porta Sacola Supermercado.png'),
  prod(63, 'Sacola com Rodízio',                'MPB-005', 'Malotes, Pastas e Bolsas',   0,  5, true,  '/imagens/malotes/Sacola com Rodízio.png'),
  prod(64, 'Urna em Lona',                      'MPB-006', 'Malotes, Pastas e Bolsas',   0,  5, true,  '/imagens/malotes/Urna em Lona.png'),
  prod(65, 'Malote Correio 30x25x10 Marrom',    'MPB-M01', 'Malotes, Pastas e Bolsas',   1,  2, true,  '/imagens/malotes/Malote Correio.png'),
  prod(66, 'Malote Correio 56x36x10 Azul',      'MPB-M02', 'Malotes, Pastas e Bolsas',   5,  2, true,  '/imagens/malotes/Malote Correio.png'),
  prod(67, 'Malote Lona 52x34x17 Laranja',      'MPB-M03', 'Malotes, Pastas e Bolsas',   4,  2, true,  '/imagens/malotes/Malote Correio.png'),
  prod(68, 'Pasta Emborrachada 30x40 Azul',     'MPB-P01', 'Malotes, Pastas e Bolsas',  18,  5, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(69, 'Pasta Lona 30x40',                  'MPB-P02', 'Malotes, Pastas e Bolsas',   5,  3, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(70, 'Pasta Lona 40x35 c/ Visores Verde', 'MPB-P03', 'Malotes, Pastas e Bolsas',  13,  3, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(71, 'Pasta Lona 34x27 Verde',            'MPB-P04', 'Malotes, Pastas e Bolsas',  15,  3, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(72, 'Pasta Lona 40x35 Azul',             'MPB-P05', 'Malotes, Pastas e Bolsas',  21,  5, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(73, 'Pasta Lona 30x40 Visor Lateral Verde','MPB-P06','Malotes, Pastas e Bolsas',  3,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(74, 'Pasta Lona 21x36 Preto',            'MPB-P07', 'Malotes, Pastas e Bolsas',  49,  5, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(75, 'Pasta Nylon 30x40',                 'MPB-P08', 'Malotes, Pastas e Bolsas',   6,  3, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(76, 'Pasta Nylon 29x39 Cinza',           'MPB-P09', 'Malotes, Pastas e Bolsas',   1,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(77, 'Pasta Nylon 28x40 Verde',           'MPB-P10', 'Malotes, Pastas e Bolsas',   1,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(78, 'Pasta Nylon 40x35x8',               'MPB-P11', 'Malotes, Pastas e Bolsas',   6,  3, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(79, 'Pasta Nylon 46x41x8 Vermelho',      'MPB-P12', 'Malotes, Pastas e Bolsas',   4,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(80, 'Pasta Nylon 35x30 Azul',            'MPB-P13', 'Malotes, Pastas e Bolsas',  10,  3, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(81, 'Pasta 51x41x8 Verde',               'MPB-P14', 'Malotes, Pastas e Bolsas',   4,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(82, 'Pasta 45x40x6 Verde',               'MPB-P15', 'Malotes, Pastas e Bolsas',   2,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(83, 'Pasta 46x41 Verde',                 'MPB-P16', 'Malotes, Pastas e Bolsas',   1,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(84, 'Pasta 17x26 sem Alça Preto',        'MPB-P17', 'Malotes, Pastas e Bolsas',   5,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(85, 'Pasta 40x26 Preto',                 'MPB-P18', 'Malotes, Pastas e Bolsas',   4,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(86, 'Pasta 30x40 Mix (Nylon/Emborrachada)','MPB-P19','Malotes, Pastas e Bolsas',  4,  2, true,  '/imagens/malotes/Pasta para Documentos.png'),
  prod(87, 'Bolsa Preta Lona 37x39x21',         'MPB-B01', 'Malotes, Pastas e Bolsas',   4,  2, true,  '/imagens/malotes/Bolsa com Zíper (estilo Sacola).png'),

  // ── SAQUINHOS PLÁSTICOS ── (nova categoria, qtd confirmada)
  prod(88,  'Saquinho Plástico 25x35x6',        'SAQ-001', 'Saquinhos Plásticos',  8, 2, true,  ''),
  prod(89,  'Saquinho Plástico 45x20x6',        'SAQ-002', 'Saquinhos Plásticos',  8, 2, true,  ''),
  prod(90,  'Saquinho Plástico 30x60x6',        'SAQ-003', 'Saquinhos Plásticos', 15, 2, true,  ''),
  prod(91,  'Saquinho Plástico 20x35x6',        'SAQ-004', 'Saquinhos Plásticos',  1, 1, true,  ''),
  prod(92,  'Saquinho Plástico 20x25x6',        'SAQ-005', 'Saquinhos Plásticos',  2, 1, true,  ''),
  prod(93,  'Saquinho Plástico 30x70x6',        'SAQ-006', 'Saquinhos Plásticos', 19, 3, true,  ''),
  prod(94,  'Saquinho Plástico 30x35x6',        'SAQ-007', 'Saquinhos Plásticos',  8, 2, true,  ''),
  prod(95,  'Saquinho Plástico 38x45x6',        'SAQ-008', 'Saquinhos Plásticos',  6, 2, true,  ''),
  prod(96,  'Saquinho Plástico 12x17',          'SAQ-009', 'Saquinhos Plásticos',  3, 1, true,  ''),

  // ── MÁQUINAS ──
  prod(97,  'Máquina Lacradora Quadrada',       'MAQ-001', 'Máquinas',  72,  2, true,  '/imagens/maquinas/Máquina lacradora quadrada.png'),
  prod(98,  'Máquina Lacradora Redonda',        'MAQ-002', 'Máquinas',  16,  2, true,  '/imagens/maquinas/Máquina lacradora redonda.png'),
  prod(99,  'Máquina Seladora',                 'MAQ-003', 'Máquinas',   0,  1, true,  '/imagens/maquinas/Máquina seladora.png'),
  prod(100, 'Refil de Selagem / Fios Etiqueta', 'MAQ-004', 'Máquinas',  12,  3, true,  '/imagens/maquinas/Refil de selagem.png'),

  // ── MATERIAIS DE USO INTERNO ──
  prod(101, 'Estilete',                         'UTL-001', 'Material de Uso Interno',  10,  3, true,  ''),
  prod(102, 'Lâmpada',                          'UTL-002', 'Material de Uso Interno',   2,  2, true,  ''),
  prod(103, 'Silicone em Bastão',               'UTL-003', 'Material de Uso Interno',   8,  3, true,  ''),
  prod(104, 'Tek Bond Spray',                   'UTL-004', 'Material de Uso Interno',   3,  2, true,  ''),
  prod(105, 'Sacola de Fios',                   'UTL-005', 'Material de Uso Interno',   1,  1, true,  ''),
  prod(106, 'Steck 25A',                        'UTL-006', 'Material de Uso Interno',   5,  2, true,  ''),
  prod(107, 'Solução de Limpeza para Máquina',  'UTL-007', 'Material de Uso Interno',   2,  1, true,  ''),
  prod(108, 'Caixa de Livros (NF/Blocos)',       'UTL-008', 'Material de Uso Interno',   2,  1, true,  ''),

  // ── COPA E COZINHA ──
  prod(109, 'Caixinha de Suco (Jng)',            'COP-001', 'Copa e Cozinha',  16,  5, true,  ''),
  prod(110, 'Rosquinha',                         'COP-002', 'Copa e Cozinha',   4,  2, true,  ''),
  prod(111, 'Rosquinha de Leite',                'COP-003', 'Copa e Cozinha',   1,  2, true,  ''),
  prod(112, 'Biscoito de Coco',                  'COP-004', 'Copa e Cozinha',   2,  2, true,  ''),
  prod(113, 'Biscoito de Leite',                 'COP-005', 'Copa e Cozinha',   1,  2, true,  ''),
  prod(114, 'Biscoito Maria',                    'COP-006', 'Copa e Cozinha',   2,  2, true,  ''),
  prod(115, 'Creme Crack',                       'COP-007', 'Copa e Cozinha',  17,  3, true,  ''),
  prod(116, 'Massa de Bola',                     'COP-008', 'Copa e Cozinha',   2,  2, true,  ''),
  prod(117, 'Sardinho',                          'COP-009', 'Copa e Cozinha',   2,  2, true,  ''),
];

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// Se a versão do seed mudou, reinicia o catálogo de produtos
function initProdutos() {
  const version = localStorage.getItem(SEED_VERSION_KEY);
  if (version !== SEED_VERSION) {
    const inicial = normalizeProdutos(produtosIniciais);
    saveData(PRODUTOS_KEY, inicial);
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return inicial;
  }
  return normalizeProdutos(loadData(PRODUTOS_KEY, produtosIniciais));
}

const EstoqueContext = createContext();

function toApiProduct(p) {
  return {
    name: p.nome || '',
    code: p.codigo || '',
    category: p.categoria || '',
    model: p.modelo || '',
    size: p.tamanho || '',
    material: p.material || '',
    color: p.cor || '',
    stockCurrent: Number(p.estoqueAtual || 0),
    stockMinimum: Number(p.estoqueMinimo || 0),
    controlsStock: p.controlaEstoque ?? true,
    alertEnabled: p.geraAlerta ?? true,
    active: p.ativo ?? true,
    image: p.imagem || '',
  };
}

function fromApiProduct(p) {
  return {
    id: p.id,
    nome: p.name,
    codigo: p.code || '',
    categoria: p.category || '',
    modelo: p.model || '',
    tamanho: p.size || '',
    material: p.material || '',
    cor: p.color || '',
    estoqueAtual: Number(p.stockCurrent || 0),
    estoqueMinimo: Number(p.stockMinimum || 0),
    controlaEstoque: p.controlsStock ?? true,
    geraAlerta: p.alertEnabled ?? true,
    ativo: p.active ?? true,
    imagem: withBase(p.image || ''),
    criadoEm: p.createdAt || new Date().toISOString(),
    atualizadoEm: p.updatedAt || new Date().toISOString(),
  };
}

function fromApiMovement(m) {
  return {
    id: m.id,
    produtoId: m.productId,
    produtoNome: m.product?.name || '',
    tipo: m.type,
    quantidade: Number(m.quantity || 0),
    observacao: m.note || '',
    usuario: m.user?.name || 'Sistema',
    usuarioPerfil: m.user?.role || '',
    estoqueAntes: m.beforeStock ?? null,
    estoqueDepois: m.afterStock ?? null,
    criadoEm: m.createdAt || new Date().toISOString(),
  };
}

export function EstoqueProvider({ children }) {
  const [produtos, setProdutosState] = useState(() => initProdutos());
  const [movimentacoes, setMovimentacoesState] = useState(() => loadData(MOV_KEY, []));
  const [auditoria, setAuditoriaState] = useState(() => loadData(AUDIT_KEY, []));
  const [syncStatus, setSyncStatus] = useState({ ok: true, lastSync: null });

  React.useEffect(() => {
    let mounted = true;
    let timer = null;
    let inFlight = false;

    async function syncFromApi() {
      if (inFlight) return;
      inFlight = true;
      try {
        const [productsResp, movementsResp] = await Promise.all([
          apiRequest('/api/products'),
          apiRequest('/api/movements'),
        ]);

        if (!mounted) return;

        const productsOk = productsResp.ok && productsResp.data?.ok && Array.isArray(productsResp.data.data);
        const movementsOk = movementsResp.ok && movementsResp.data?.ok && Array.isArray(movementsResp.data.data);

        if (productsOk) {
          const mapped = normalizeProdutos(productsResp.data.data.map(fromApiProduct));
          setProdutosState((prev) => {
            const sameLen = prev.length === mapped.length;
            const sameJson = sameLen && JSON.stringify(prev) === JSON.stringify(mapped);
            if (sameJson) return prev;
            saveData(PRODUTOS_KEY, mapped);
            return mapped;
          });
        }

        if (movementsOk) {
          const mapped = movementsResp.data.data.map(fromApiMovement);
          setMovimentacoesState((prev) => {
            const sameLen = prev.length === mapped.length;
            const sameJson = sameLen && JSON.stringify(prev) === JSON.stringify(mapped);
            if (sameJson) return prev;
            saveData(MOV_KEY, mapped);
            return mapped;
          });
        }

        setSyncStatus({ ok: productsOk && movementsOk, lastSync: new Date() });
      } catch (e) {
        if (mounted) setSyncStatus({ ok: false, lastSync: new Date(), error: String(e?.message || e) });
      } finally {
        inFlight = false;
      }
    }

    // Sincronização inicial + polling a cada 5s para multi-usuário ao vivo
    syncFromApi();
    timer = setInterval(syncFromApi, 5000);

    // Pausa o polling quando a aba está em background (economia de banda)
    function onVisibility() {
      if (document.hidden) {
        if (timer) { clearInterval(timer); timer = null; }
      } else {
        if (!timer) {
          syncFromApi();
          timer = setInterval(syncFromApi, 5000);
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Permite forçar refresh manual de qualquer componente
    window.__sizSyncNow = syncFromApi;

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      delete window.__sizSyncNow;
    };
  }, []);

  // Salva e atualiza estado
  const setProdutos = useCallback((fn) => {
    setProdutosState(prev => {
      const next = normalizeProdutos(typeof fn === 'function' ? fn(prev) : fn);
      saveData(PRODUTOS_KEY, next);
      return next;
    });
  }, []);

  const setMovimentacoes = useCallback((fn) => {
    setMovimentacoesState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveData(MOV_KEY, next);
      return next;
    });
  }, []);

  const setAuditoria = useCallback((fn) => {
    setAuditoriaState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveData(AUDIT_KEY, next);
      return next;
    });
  }, []);

  // Registrar auditoria
  const registrarAuditoria = useCallback((usuario, entidade, acao, antes, depois) => {
    const log = {
      id: Date.now(),
      usuario: usuario?.nome || 'Sistema',
      perfil: usuario?.perfil || '',
      entidade,
      acao,
      antes: antes ? JSON.stringify(antes) : null,
      depois: depois ? JSON.stringify(depois) : null,
      criadoEm: new Date().toISOString(),
    };
    setAuditoria(prev => [log, ...prev]);
  }, [setAuditoria]);

  // CRUD Produtos
  const criarProduto = useCallback((dados, user) => {
    const novo = { ...dados, id: Date.now(), criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    setProdutos(prev => [...prev, novo]);
    registrarAuditoria(user, 'PRODUTO', 'CRIACAO', null, novo);

    apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(toApiProduct(novo)),
    }).then((resp) => {
      if (resp.ok && resp.data?.ok && resp.data?.data) {
        const apiMapped = fromApiProduct(resp.data.data);
        setProdutos((prev) => prev.map((p) => (p.id === novo.id ? apiMapped : p)));
      }
    });

    return novo;
  }, [setProdutos, registrarAuditoria]);

  const editarProduto = useCallback((id, dados, user) => {
    let antes = null;
    setProdutos(prev => prev.map(p => {
      if (p.id === id) {
        antes = p;
        return { ...p, ...dados, atualizadoEm: new Date().toISOString() };
      }
      return p;
    }));
    registrarAuditoria(user, 'PRODUTO', 'EDICAO', antes, { ...antes, ...dados });

    const payload = { ...(antes || {}), ...dados };
    apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiProduct(payload)),
    });
  }, [setProdutos, registrarAuditoria]);

  const excluirProduto = useCallback((id, user) => {
    let antes = null;
    setProdutos(prev => {
      antes = prev.find(p => p.id === id);
      return prev.filter(p => p.id !== id);
    });
    registrarAuditoria(user, 'PRODUTO', 'EXCLUSAO', antes, null);

    apiRequest(`/api/products/${id}`, { method: 'DELETE' });
  }, [setProdutos, registrarAuditoria]);

  // Movimentações
  const registrarMovimentacao = useCallback((dados, user) => {
    const { produtoId, tipo, quantidade, observacao } = dados;
    let erro = null;
    let movNova = null;

    setProdutos(prev => {
      const produto = prev.find(p => p.id === Number(produtoId));
      if (!produto) { erro = 'Produto não encontrado'; return prev; }
      if (tipo === 'SAIDA' && produto.estoqueAtual < Number(quantidade)) {
        erro = `Estoque insuficiente! Disponível: ${produto.estoqueAtual}`;
        return prev;
      }
      const estoqueAntes = produto.estoqueAtual;
      const estoqueDepois = tipo === 'ENTRADA'
        ? produto.estoqueAtual + Number(quantidade)
        : produto.estoqueAtual - Number(quantidade);

      movNova = {
        id: Date.now(),
        produtoId: Number(produtoId),
        produtoNome: produto.nome,
        tipo,
        quantidade: Number(quantidade),
        observacao: observacao || '',
        usuario: user?.nome || '',
        usuarioPerfil: user?.perfil || '',
        estoqueAntes,
        estoqueDepois,
        criadoEm: new Date().toISOString(),
      };

      setMovimentacoes(prevM => {
        const next = [movNova, ...prevM];
        saveData(MOV_KEY, next);
        return next;
      });

      registrarAuditoria(user, 'MOVIMENTACAO', 'MOVIMENTACAO',
        { estoque: estoqueAntes },
        { estoque: estoqueDepois, tipo, quantidade: Number(quantidade) }
      );

      return prev.map(p => p.id === Number(produtoId)
        ? { ...p, estoqueAtual: estoqueDepois, atualizadoEm: new Date().toISOString() }
        : p
      );
    });

    if (!erro && movNova) {
      apiRequest('/api/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: movNova.produtoId,
          type: movNova.tipo,
          quantity: movNova.quantidade,
          note: movNova.observacao,
        }),
      });
    }

    return { erro };
  }, [setProdutos, setMovimentacoes, registrarAuditoria]);

  // Alertas
  const alertas = produtos.filter(p => p.geraAlerta && p.estoqueAtual <= p.estoqueMinimo && p.ativo);

  return (
    <EstoqueContext.Provider value={{
      produtos, movimentacoes, auditoria, alertas,
      criarProduto, editarProduto, excluirProduto, registrarMovimentacao,
      registrarAuditoria,
      syncStatus,
    }}>
      {children}
    </EstoqueContext.Provider>
  );
}

export function useEstoque() {
  return useContext(EstoqueContext);
}
