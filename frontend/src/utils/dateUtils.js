const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function getMonthRange(month, year) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export function getCurrentMonth() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function getAvailableYears() {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1, current + 2]
}

export { MONTHS }
