import { useState, useEffect } from 'react'
import { MONTHS, getCurrentMonth, getAvailableYears, getMonthRange } from '../utils/dateUtils'

export default function DateFilter({ value, onChange }) {
  const [selectedMonth, setSelectedMonth] = useState(value?.month || getCurrentMonth().month)
  const [selectedYear, setSelectedYear] = useState(value?.year || getCurrentMonth().year)

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
      <span className="text-sm font-medium text-gray-700">Filtrar por fecha:</span>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(Number(e.target.value))}
        className="input-field py-1.5 text-sm"
      >
        {MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="input-field py-1.5 text-sm w-24"
      >
        {getAvailableYears().map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
