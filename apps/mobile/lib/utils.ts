export const formatCents = (cents: number | null | undefined, currency = 'USD'): string => {
  const value = cents ?? 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('')
}

export const proportionalShare = (
  mySubtotalCents: number,
  totalSubtotalCents: number,
  taxCents: number,
  tipCents: number
): number => {
  if (totalSubtotalCents <= 0) {
    return mySubtotalCents
  }

  const extras = taxCents + tipCents
  const ratio = mySubtotalCents / totalSubtotalCents
  return mySubtotalCents + Math.round(extras * ratio)
}
