export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) return null
  const [rubles, kopecks = ''] = normalized.split('.')
  const amount = Number(rubles) * 100 + Number(kopecks.padEnd(2, '0'))
  return amount > 0 ? amount : null
}

const formatter = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })
export const formatMoney = (kopecks: number): string => formatter.format(kopecks / 100)
