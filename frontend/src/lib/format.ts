const WHATSAPP_LABELS: Record<string, string> = {
  RECLAMACAO: 'Reclamação',
  SUGESTAO: 'Sugestão',
  SOLICITACAO: 'Solicitação',
  ELOGIO: 'Elogio',
}

export function feedbackTypeLabel(type: string): string {
  return WHATSAPP_LABELS[type] ?? type
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function ratingColor(rating: number): string {
  if (rating >= 8) return 'text-emerald-600'
  if (rating >= 6) return 'text-amber-600'
  return 'text-red-600'
}

export function gaugeColor(percentage: number): string {
  if (percentage >= 75) return '#10b981'
  if (percentage >= 50) return '#5b5fed'
  if (percentage >= 30) return '#f59e0b'
  return '#ef4444'
}