export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isValidDate(value: string): boolean {
  const date = new Date(`${value}T12:00:00`)
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && localDate(date) === value && date.getFullYear() > 0
}

export const isValidMonth = (value: string): boolean => /^\d{4}-\d{2}$/.test(value) && isValidDate(`${value}-01`)
export const formatDate = (date: string): string => date.split('-').reverse().join('.')
