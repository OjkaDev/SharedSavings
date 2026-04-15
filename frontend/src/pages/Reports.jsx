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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `€${value}`,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 },
        },
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Informes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualiza tus finanzas con gráficos interactivos
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilter onChange={setDateRange} year={currentYear} />
        </div>
      </div>

      {/* Cards resumen anual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Ingresos ({year})</p>
              <p className="text-xl font-bold text-green-700">€{totalIncome.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center">
            <ArrowTrendingDownIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-red-600 font-medium">Gastos ({year})</p>
              <p className="text-xl font-bold text-red-700">€{totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className={`card border ${
          totalSavings >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center">
            <CurrencyDollarIcon className={`h-8 w-8 mr-3 ${
              totalSavings >= 0 ? 'text-blue-500' : 'text-orange-500'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                totalSavings >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>Ahorro ({year})</p>
              <p className={`text-xl font-bold ${
                totalSavings >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>€{totalSavings.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border border-purple-200">
          <div className="flex items-center">
            <ChartPieIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Gastos compartidos</p>
              <p className="text-xl font-bold text-purple-700">€{totalShared.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Ingresos vs Gastos */}
        <div className="card">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Ingresos vs Gastos</h2>
          </div>
          <div className="h-72">
            <Bar data={incomeVsExpensesData} options={chartOptions} />
          </div>
        </div>

        {/* 2. Distribución por categoría */}
        <div className="card">
          <div className="flex items-center mb-4">
            <ChartPieIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Gastos por categoría</h2>
          </div>
          <div className="h-72">
            {personalSummary?.by_category?.length > 0 ? (
              <Doughnut data={categoryData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No hay datos de categorías
              </div>
            )}
          </div>
        </div>

        {/* 3. Evolución de gastos */}
        <div className="card">
          <div className="flex items-center mb-4">
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Evolución mensual</h2>
          </div>
          <div className="h-72">
            <Line data={expenseTrendData} options={chartOptions} />
          </div>
        </div>

        {/* 4. Ahorro mensual */}
        <div className="card">
          <div className="flex items-center mb-4">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Ahorro mensual</h2>
          </div>
          <div className="h-72">
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
        <div className="card lg:col-span-2">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Gastos personales vs compartidos</h2>
          </div>
          <div className="h-72">
            <Bar data={sharedVsPersonalData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
