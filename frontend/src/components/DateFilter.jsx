import { useState, useEffect } from 'react'
import { MONTHS, PERIODS, getCurrentMonth, getCurrentQuarter, getCurrentSemester, getAvailableYears, getPeriodRange } from '../utils/dateUtils'

const QUARTERS = [
  { value: 1, label: 'Ene-Mar' },
  { value: 2, label: 'Abr-Jun' },
  { value: 3, label: 'Jul-Sep' },
  { value: 4, label: 'Oct-Dic' },
]

const SEMESTERS = [
  { value: 1, label: 'Ene-Jun' },
  { value: 2, label: 'Jul-Dic' },
]

const selectClass = [
  'appearance-none bg-dark-800 border border-dark-700 rounded-lg',
  'py-2 pl-3 pr-9 text-sm text-dark-100',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
  'cursor-pointer transition-all duration-200 hover:border-dark-500',
  'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%2394a3b8%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27M6%208l4%204%204-4%27/%3E%3C/svg%3E")]',
  'bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat',
].join(' ')

export default function DateFilter({ value, onChange, year: initialYear }) {
  const [period, setPeriod] = useState(value?.period || 'month')
  const [selectedSub, setSelectedSub] = useState(value?.month || getCurrentMonth().month)
  const [selectedYear, setSelectedYear] = useState(value?.year || initialYear || getCurrentMonth().year)

  useEffect(() => {
    const range = getPeriodRange(period, selectedSub, selectedYear)
    onChange({ ...range, period, month: period === 'month' ? selectedSub : null, year: selectedYear })
  }, [period, selectedSub, selectedYear])

  useEffect(() => {
    if (value?.period && value.period !== period) {
      setPeriod(value.period)
    }
    if (value?.month && period === 'month') {
      setSelectedSub(value.month)
    }
  }, [value])

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    switch (newPeriod) {
      case 'month':
        setSelectedSub(getCurrentMonth().month)
        break
      case 'quarter':
        setSelectedSub(getCurrentQuarter().quarter)
        break
      case 'semester':
        setSelectedSub(getCurrentSemester().semester)
        break
      case 'year':
        setSelectedSub(1)
        break
    }
  }

  const getSubOptions = () => {
    if (period === 'month') return MONTHS.map((m, i) => ({ value: i + 1, label: m }))
    if (period === 'quarter') return QUARTERS
    if (period === 'semester') return SEMESTERS
    return []
  }

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-3">
      {/* Segmented control */}
      <div className="inline-flex bg-dark-800 rounded-xl p-1 border border-dark-700 w-full sm:w-auto">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
              period === p.value
                ? 'bg-primary-500 text-white font-medium shadow-sm'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Selects agrupados */}
      <div className="flex items-center gap-2">
        {period !== 'year' && (
          <select
            value={selectedSub}
            onChange={(e) => setSelectedSub(Number(e.target.value))}
            className={`${selectClass} min-w-[110px]`}
          >
            {getSubOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className={`${selectClass} min-w-[90px]`}
        >
          {getAvailableYears().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
