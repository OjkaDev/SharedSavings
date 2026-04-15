import { useState, useEffect } from 'react'
import { MONTHS, getCurrentMonth, getAvailableYears, getMonthRange } from '../utils/dateUtils'

export default function DateFilter({ value, onChange, year: initialYear }) {
  const [selectedMonth, setSelectedMonth] = useState(value?.month || getCurrentMonth().month)
  const [selectedYear, setSelectedYear] = useState(value?.year || initialYear || getCurrentMonth().year)

  useEffect(() => {
    const range = getMonthRange(selectedMonth, selectedYear)
    onChange({ ...range, month: selectedMonth, year: selectedYear })
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (value) {
      setSelectedMonth(value.month)
      setSelectedYear(value.year)
    }
  }, [value])

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-dark-300">Filtrar por:</span>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(Number(e.target.value))}
        className="input-field py-2 px-3 text-sm bg-dark-800"
      >
        {MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="input-field py-2 px-3 text-sm w-24 bg-dark-800"
      >
        {getAvailableYears().map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}