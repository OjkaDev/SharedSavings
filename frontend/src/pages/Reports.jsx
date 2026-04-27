import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import DateFilter from '../components/DateFilter'
import { getCurrentMonth, getMonthRange, getPeriodLabel } from '../utils/dateUtils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ChartBarIcon,
  FireIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const COLORS = {
  income: 'rgba(34, 197, 94, 0.7)',
  incomeBorder: 'rgba(34, 197, 94, 1)',
  expense: 'rgba(239, 68, 68, 0.7)',
  expenseBorder: 'rgba(239, 68, 68, 1)',
  total: 'rgba(99, 102, 241, 0.7)',
  totalBorder: 'rgba(99, 102, 241, 1)',
  myShare: 'rgba(168, 85, 247, 0.7)',
  myShareBorder: 'rgba(168, 85, 247, 1)',
}

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#64748b', '#78716c',
]

export default function Reports() {
  const currentYear = new Date().getFullYear()
  const [dateRange, setDateRange] = useState(() => getMonthRange(getCurrentMonth().month, getCurrentMonth().year))
  const [monthlyPersonal, setMonthlyPersonal] = useState([])
  const [monthlyShared, setMonthlyShared] = useState([])
  const [personalSummary, setPersonalSummary] = useState(null)
  const [topExpenses, setTopExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const year = useMemo(() => dateRange?.year || currentYear, [dateRange, currentYear])

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    try {
      const [personalRes, sharedRes, personalSumRes, topRes] = await Promise.all([
        api.get('/personal/monthly', { params: { year } }),
        api.get('/expenses/monthly', { params: { year } }),
        api.get('/personal/summary', { params: dateRange }),
        api.get('/personal/top-expenses', { params: { start_date: dateRange.start_date, end_date: dateRange.end_date, limit: 10 } }),
      ])
      setMonthlyPersonal(personalRes.data)
      setMonthlyShared(sharedRes.data)
      setPersonalSummary(personalSumRes.data)
      setTopExpenses(topRes.data)
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthsInRange = () => {
    if (!dateRange?.start_date || !dateRange?.end_date) return null
    const startMonth = new Date(dateRange.start_date).getMonth() + 1
    const endMonth = new Date(dateRange.end_date).getMonth() + 1
    const months = []
    for (let m = startMonth; m <= endMonth; m++) months.push(m)
    return months
  }

  const monthsInRange = getMonthsInRange()

  const periodLabel = getPeriodLabel(dateRange)

  const filteredPersonal = monthsInRange
    ? monthlyPersonal.filter(m => monthsInRange.includes(m.month))
    : monthlyPersonal
  const filteredShared = monthsInRange
    ? monthlyShared.filter(m => monthsInRange.includes(m.month))
    : monthlyShared

  const totalIncome = filteredPersonal.reduce((sum, m) => sum + m.income, 0)
  const totalExpenses = filteredPersonal.reduce((sum, m) => sum + m.expenses, 0)
  const totalSavings = totalIncome - totalExpenses
  const totalShared = filteredShared.reduce((sum, m) => sum + m.total, 0)
  const totalMyShare = filteredShared.reduce((sum, m) => sum + m.my_share, 0)

  // Chart 1: Ingresos vs Gastos (Barras)
  const incomeVsExpensesData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyPersonal.map(m => m.income),
        backgroundColor: COLORS.income,
        borderColor: COLORS.incomeBorder,
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: monthlyPersonal.map(m => m.expenses),
        backgroundColor: COLORS.expense,
        borderColor: COLORS.expenseBorder,
        borderWidth: 1,
      },
    ],
  }

  // Chart 2: Distribución por categoría (Donut)
  const categoryData = {
    labels: personalSummary?.by_category?.map(c => c.name) || [],
    datasets: [
      {
        data: personalSummary?.by_category?.map(c => c.total) || [],
        backgroundColor: CHART_COLORS.slice(0, (personalSummary?.by_category?.length || 0)),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  // Chart 3: Gastos compartidos vs personales (Barras agrupadas)
  const sharedVsPersonalData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Gastos personales',
        data: monthlyPersonal.map(m => m.expenses),
        backgroundColor: COLORS.expense,
        borderColor: COLORS.expenseBorder,
        borderWidth: 1,
      },
      {
        label: 'Total gastos compartidos',
        data: monthlyShared.map(m => m.total),
        backgroundColor: COLORS.total,
        borderColor: COLORS.totalBorder,
        borderWidth: 1,
      },
      {
        label: 'Mi parte compartida',
        data: monthlyShared.map(m => m.my_share),
        backgroundColor: COLORS.myShare,
        borderColor: COLORS.myShareBorder,
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          padding: 15,
          font: { size: 12 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(71, 85, 105, 0.3)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          callback: (value) => `€${value}`,
        },
        grid: { color: 'rgba(71, 85, 105, 0.3)' },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    cutout: '65%',
  }

  // Chart data: Top gastos
  const topExpensesData = {
    labels: topExpenses.map(e => e.description.length > 20 ? e.description.slice(0, 20) + '...' : e.description),
    datasets: [
      {
        label: 'Monto',
        data: topExpenses.map(e => e.amount),
        backgroundColor: topExpenses.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const horizontalBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = topExpenses[ctx.dataIndex]
            return `${item.category_name}: €${item.amount.toFixed(2)} (${item.type === 'debt' ? 'deuda' : 'personal'})`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', callback: (v) => `€${v}` },
        grid: { color: 'rgba(71, 85, 105, 0.3)' },
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { display: false },
      },
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Ingresos',
      value: `€${totalIncome.toFixed(2)}`,
      icon: ArrowTrendingUpIcon,
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      name: 'Gastos',
      value: `€${totalExpenses.toFixed(2)}`,
      icon: ArrowTrendingDownIcon,
      gradient: 'from-red-400 to-rose-500',
    },
    {
      name: 'Ahorro',
      value: `€${totalSavings.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      gradient: totalSavings >= 0 ? 'from-cyan-400 to-blue-500' : 'from-orange-400 to-red-500',
    },
    {
      name: 'Gastos Compartidos',
      value: `€${totalShared.toFixed(2)}`,
      icon: ChartPieIcon,
      gradient: 'from-purple-400 to-indigo-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="heading">Informes</h1>
          <p className="subheading mt-1">Visualiza tus finanzas con gráficos interactivos</p>
        </div>
        <DateFilter onChange={setDateRange} year={currentYear} />
      </div>

      {/* Cards resumen por periodo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-3 md:p-5 flex flex-col text-center">
            <p className="text-dark-300 text-xs md:text-sm font-medium mb-2 md:mb-3">{stat.name}</p>
            <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
              </div>
              <p className="text-lg md:text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <p className="text-dark-500 text-xs">Total {periodLabel}</p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Ingresos vs Gastos */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-3">
              <ChartBarIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-dark-50">Ingresos vs Gastos</h2>
          </div>
          <div className="h-56 md:h-72">
            <Bar data={incomeVsExpensesData} options={chartOptions} />
          </div>
        </div>

        {/* 2. Distribución por categoría */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mr-3">
              <ChartPieIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-dark-50">Gastos por categoría</h2>
          </div>
          <div className="h-56 md:h-72">
            {personalSummary?.by_category?.length > 0 ? (
              <Doughnut data={categoryData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400 text-sm">
                No hay datos de categorías
              </div>
            )}
          </div>
        </div>

        {/* 3. Gastos compartidos vs personales */}
        <div className="card p-4 md:p-6 lg:col-span-2">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mr-3">
              <ChartBarIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-dark-50">Gastos personales vs compartidos</h2>
          </div>
          <div className="h-56 md:h-72">
            <Bar data={sharedVsPersonalData} options={chartOptions} />
          </div>
        </div>

        {/* 4. Top Gastos */}
        <div className="card p-4 md:p-6 lg:col-span-2">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mr-3">
              <FireIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-dark-50">Top Gastos</h2>
          </div>
          <div className="h-64 md:h-80">
            {topExpenses.length > 0 ? (
              <Bar data={topExpensesData} options={horizontalBarOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400 text-sm">
                No hay datos de gastos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
