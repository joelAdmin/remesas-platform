import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '-'
  const [int, dec] = num.toFixed(decimals).split('.')
  const intPart = (int || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const decPart = dec ? dec.replace(/0+$/, '') : ''
  return decPart ? `${intPart},${decPart}` : intPart
}
