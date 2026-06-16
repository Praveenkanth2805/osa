export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateReceiptNumber(sequence: number): string {
  return String(sequence).padStart(5, '0')
}

export function validateMobile(mobile: string): boolean {
  return /^[0-9]{10}$/.test(mobile)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}