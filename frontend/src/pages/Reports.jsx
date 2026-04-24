import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import DateFilter from '../components/DateFilter'
import { getCurrentMonth, getMonthRange, getAvailableYears } from '../utils/dateUtils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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
  savings: 'rgba(34, 197, 94, 0.7)',
  savingsNeg: 'rgba(239, 68, 68, 0.7)',
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
  const [sharedSummary, setSharedSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const year = useMemo(() => dateRange?.year || currentYear, [dateRange, currentYear])

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    try {
      const [personalRes, sharedRes, personalSumRes, sharedSumRes] = await Promise.all([
        api.get('/personal/monthly', { params: { year } }),
        api.get('/expenses/monthly', { params: { year } }),
        api.get('/personal/summary', { params: dateRange }),
        api.get('/expenses/summary', { params: dateRange }),
      ])
      setMonthlyPersonal(personalRes.data)
      setMonthlyShared(sharedRes.data)
      setPersonalSummary(personalSumRes.data)
      setSharedSummary(sharedSumRes.data)
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = monthlyPersonal.reduce((sum, m) => sum + m.income, 0)
  const totalExpenses = monthlyPersonal.reduce((sum, m) => sum + m.expenses, 0)
  const totalSavings = totalIncome - totalExpenses
  const totalShared = monthlyShared.reduce((sum, m) => sum + m.total, 0)
  const totalMyShare = monthlyShared.reduce((sum, m) => sum + m.my_share, 0)

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

  // Chart 3: Evolución de gastos (Línea)
  const expenseTrendData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Gastos',
        data: monthlyPersonal.map(m => m.expenses),
        borderColor: COLORS.expenseBorder,
        backgroundColor: COLORS.expense,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Ingresos',
        data: monthlyPersonal.map(m => m.income),
        borderColor: COLORS.incomeBorder,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  }

  // Chart 4: Ahorro mensual (Barras)
  const savingsData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Ahorro',
        data: monthlyPersonal.map(m => m.balance),
        backgroundColor: monthlyPersonal.map(m =>
          m.balance >= 0 ? COLORS.savings : COLORS.savingsNeg
        ),
        borderWidth: 1,
      },
    ],
  }

  // Chart 5: Gastos compartidos vs personales (Barras agrupadas)
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

      {/* Cards resumen anual */}
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
            <p className="text-dark-500 text-xs">Total de {year}</p>
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

        {/* 3. Evolución de gastos */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-3">
              <ArrowTrendingUpIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-dark-50">Evolución mensual</h2>
          </div>
          <div className="h-56 md:h-72">
            <Line data={expenseTrendData} options={chartOptions} />
          </div>
        </div>

        {/* 4. Ahorro mensual */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-3">
              <CurrencyDollarIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-dark-50">Ahorro mensual</h2>
          </div>
          <div className="h-56 md:h-72">
            <Bar
              data={savingsData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>

        {/* 5. Gastos compartidos vs personales */}
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
      </div>
    </div>
  )
}
