const COLOR_MAP = {
  Amarela: { hex: '#FACC15', needsBorder: false },
  Azul: { hex: '#3B82F6', needsBorder: false },
  Vermelha: { hex: '#EF4444', needsBorder: false },
  Laranja: { hex: '#F97316', needsBorder: false },
  Verde: { hex: '#22C55E', needsBorder: false },
  'Lilás': { hex: '#A855F7', needsBorder: false },
  Natural: { hex: '#F8F5EC', needsBorder: true },
  Preta: { hex: '#111827', needsBorder: false },
  Inox: { hex: '#9CA3AF', needsBorder: false },
  'Metálica': { hex: '#9CA3AF', needsBorder: false },
  Branca: { hex: '#FFFFFF', needsBorder: true },
  Cinza: { hex: '#9CA3AF', needsBorder: false },
};

const HEX_TO_CANONICAL = {
  '#FACC15': 'Amarela',
  '#3B82F6': 'Azul',
  '#EF4444': 'Vermelha',
  '#F97316': 'Laranja',
  '#22C55E': 'Verde',
  '#A855F7': 'Lilás',
  '#F8F5EC': 'Natural',
  '#111827': 'Preta',
  '#9CA3AF': 'Inox',
  '#FFFFFF': 'Branca',
};

const EXACT_ALIASES = {
  amarela: 'Amarela',
  amarelo: 'Amarela',
  azul: 'Azul',
  vermelha: 'Vermelha',
  vermelho: 'Vermelha',
  laranja: 'Laranja',
  verde: 'Verde',
  lilas: 'Lilás',
  roxa: 'Lilás',
  roxo: 'Lilás',
  natural: 'Natural',
  preta: 'Preta',
  preto: 'Preta',
  inox: 'Inox',
  metalica: 'Metálica',
  metalico: 'Metálica',
  branca: 'Branca',
  branco: 'Branca',
  cinza: 'Cinza',
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function canonicalFromNormalized(norm) {
  if (!norm) return null;

  if (EXACT_ALIASES[norm]) return EXACT_ALIASES[norm];

  if (norm.includes('aco inox') || norm.includes('inoxidavel') || norm.includes('inox')) {
    return 'Inox';
  }

  if (norm.includes('metal')) {
    return 'Metálica';
  }

  return null;
}

function normalizeHex(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw.startsWith('#')) return null;
  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return raw.length === 7 ? raw : null;
}

export function getLabelFromHex(input) {
  const hex = normalizeHex(input);
  if (!hex) return null;
  return HEX_TO_CANONICAL[hex] || null;
}

export function getCanonicalColorName(input) {
  const hex = normalizeHex(input);
  if (hex && HEX_TO_CANONICAL[hex]) return HEX_TO_CANONICAL[hex];

  const norm = normalizeText(input);
  return canonicalFromNormalized(norm);
}

export function normalizeColorName(input) {
  const canonical = getCanonicalColorName(input);
  if (canonical) return canonical;
  return String(input || '').trim();
}

export function getColorFromName(input) {
  const canonical = getCanonicalColorName(input);
  if (canonical) {
    const cfg = COLOR_MAP[canonical];
    return {
      hex: cfg.hex,
      needsBorder: cfg.needsBorder,
      borderColor: '#D1D5DB',
      canonical,
    };
  }

  return {
    hex: COLOR_MAP.Branca.hex,
    needsBorder: true,
    borderColor: '#D1D5DB',
    canonical: null,
  };
}

export const PRODUCT_COLOR_OPTIONS = Object.keys(COLOR_MAP);
