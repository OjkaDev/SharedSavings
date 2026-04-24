const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const PERIODS = [
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'semester', label: 'Semestre' },
  { value: 'year', label: 'Año' },
]

export function getMonthRange(month, year) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export function getQuarterRange(quarter, year) {
  const startMonth = (quarter - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export function getSemesterRange(semester, year) {
  const startMonth = semester === 1 ? 0 : 6
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 6, 0)
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}

export function getYearRange(year) {
  return {
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
  }
}

export function getPeriodRange(period, subPeriod, year) {
  let range
  switch (period) {
    case 'month': range = getMonthRange(subPeriod, year); break
    case 'quarter': range = getQuarterRange(subPeriod, year); break
    case 'semester': range = getSemesterRange(subPeriod, year); break
    case 'year': range = getYearRange(year); break
    default: range = getMonthRange(subPeriod, year)
  }
  return { ...range, subPeriod }
}

export function getCurrentMonth() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function getCurrentQuarter() {
  const now = new Date()
  return { quarter: Math.ceil((now.getMonth() + 1) / 3), year: now.getFullYear() }
}

export function getCurrentSemester() {
  const now = new Date()
  return { semester: now.getMonth() < 6 ? 1 : 2, year: now.getFullYear() }
}

export function getAvailableYears() {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1, current + 2]
}

export { MONTHS, PERIODS }
