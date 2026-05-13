export function checkBusinessHours() {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = 7 * 60;
  const endWeek = 18 * 60;
  const endFriday = 16 * 60;

  if (day === 0 || day === 6) {
    return { ok: false, reason: 'Acesso permitido apenas de segunda a sexta-feira.' };
  }

  if (day === 5) {
    if (minutes < start || minutes >= endFriday) {
      return { ok: false, reason: 'Na sexta-feira o acesso é das 07:00 às 16:00.' };
    }
    return { ok: true };
  }

  if (minutes < start || minutes >= endWeek) {
    return { ok: false, reason: 'De segunda a quinta o acesso é das 07:00 às 18:00.' };
  }

  return { ok: true };
}
