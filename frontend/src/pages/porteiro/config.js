export const PORTEIRO_COLLECTION = 'porteiro_fila';

// Token do link QR. Ideal definir em .env como VITE_PORTARIA_QR_TOKEN.
export const QR_TOKEN = (import.meta.env && import.meta.env.VITE_PORTARIA_QR_TOKEN) || 'zenith-portaria-qr-2026';

export const AVISO_ANTECIPADO_MIN = 30;
export const TOLERANCIA_ATRASO_MIN = 10;

export const STATUS = {
  AGUARDANDO: 'aguardando',
  CHEGOU_PORTAO: 'chegou_portao',
  CHAMADO: 'chamado',
  ATENDIMENTO: 'em_atendimento',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

export const STATUS_LABEL = {
  [STATUS.AGUARDANDO]: 'Aguardando',
  [STATUS.CHEGOU_PORTAO]: 'Chegou no portao',
  [STATUS.CHAMADO]: 'Chamado',
  [STATUS.ATENDIMENTO]: 'Em atendimento',
  [STATUS.FINALIZADO]: 'Finalizado',
  [STATUS.CANCELADO]: 'Cancelado',
};

export const TIPOS = ['Transportadora', 'Retira Cliente', 'Lalamove', 'Motoboy', 'Outro'];

export function normalizeText(v) {
  return String(v || '').trim();
}

export function isValidToken(token) {
  return normalizeText(token) && normalizeText(token) === normalizeText(QR_TOKEN);
}

export function nowIso() {
  return new Date().toISOString();
}

export function getPortariaPublicLink() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${window.location.origin}${base}porta/${QR_TOKEN}`;
}
