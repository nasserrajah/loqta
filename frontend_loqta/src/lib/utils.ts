import type { Language } from './i18n';

export function formatCurrency(amount: number, currency: string, lang: Language) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}