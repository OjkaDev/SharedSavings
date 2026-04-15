import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { HomeIcon, WalletIcon, CurrencyDollarIcon, ClockIcon, ArrowTrendingUpIcon, PlusIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline'
import { MONTHS } from '../utils/dateUtils'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const currentMonth = new Date().getMonth() + 1
const monthName = MONTHS[currentMonth - 1]

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    personalIncome: 0,
    personalExpenses: 0,
    sharedTotal: 0,
    sharedPending: 0,
    households: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [personalRes, sharedRes, householdsRes] = await Promise.all([
        api.get('/personal/summary', { params: { start_date: startOfMonth, end_date: endOfMonth } }),
        api.get('/expenses/summary', { params: { start_date: startOfMonth, end_date: endOfMonth } }),
        api.get('/households'),
      ])

      setSummary({
        personalIncome: personalRes.data.income || 0,
        personalExpenses: personalRes.data.expenses || 0,
        sharedTotal: sharedRes.data.total || 0,
        sharedPending: sharedRes.data.pending || 0,
        households: householdsRes.data.length || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
      name: 'Viviendas', 
      value: summary.households, 
      icon: HomeIcon, 
      gradient: 'from-cyan-400 to-blue-500'
    },
    { 
      name: 'Gastos Compartidos', 
      value: `€${summary.sharedTotal.toFixed(2)}`, 
      icon: CurrencyDollarIcon, 
      gradient: 'from-blue-400 to-indigo-500'
    },
    { 
      name: 'Gastos Personales', 
      value: `€${summary.personalExpenses.toFixed(2)}`, 
      icon: WalletIcon, 
      gradient: 'from-orange-400 to-red-500'
    },
    { 
      name: 'Pagos Pendientes', 
      value: `€${summary.sharedPending.toFixed(2)}`, 
      icon: ClockIcon, 
      gradient: summary.sharedPending > 0 ? 'from-yellow-400 to-amber-500' : 'from-green-400 to-emerald-500'
    },
  ]

  const monthlyBalance = summary.personalIncome - summary.personalExpenses

  const pieData = {
    labels: ['Gastos', 'Ingresos'],
    datasets: [
      {
        data: [summary.personalExpenses, summary.personalIncome],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(249, 115, 22, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 15,
          font: { size: 12 },
        },
      },
    },
    cutout: '65%',
  }

  const financeMetrics = [
    {
      name: 'Gastos Personales',
      value: `€${summary.personalExpenses.toFixed(2)}`,
      icon: WalletIcon,
      gradient: 'from-orange-400 to-red-500',
    },
    {
      name: 'Ingresos',
      value: `€${summary.personalIncome.toFixed(2)}`,
      icon: ArrowTrendingUpIcon,
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      name: 'Saldo Mensual',
      value: `€${monthlyBalance.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      gradient: monthlyBalance >= 0 ? 'from-cyan-400 to-blue-500' : 'from-red-400 to-rose-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading">Dashboard</h1>
        <p className="subheading mt-1">
          Resumen de tus finanzas de este mes
        </p>
      </div>

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
            <p className="text-dark-500 text-xs">Total de {monthName}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen Financiero unificado */}
        <div className="card p-4 md:p-6">
          <h2 className="text-lg font-semibold text-dark-50 mb-4 md:mb-6">Resumen Financiero</h2>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Quesito */}
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
              <Doughnut data={pieData} options={pieOptions} />
            </div>
            
            {/* Métricas */}
            <div className="flex-1 w-full space-y-3 md:space-y-4">
              {financeMetrics.map((metric) => (
                <div key={metric.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center`}>
                      <metric.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-dark-300 text-sm">{metric.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{metric.value}</p>
                    <p className="text-dark-500 text-xs">Total de {monthName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-dark-50 mb-6">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <Link to="/personal?action=new" className="flex flex-col items-center p-3 md:p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-2 md:mb-3">
                <PlusIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <p className="text-dark-100 font-medium text-sm md:text-base">Nuevo Gasto</p>
              <p className="text-dark-500 text-xs mt-1">Registra un gasto</p>
            </Link>
            <Link to="/household" className="flex flex-col items-center p-3 md:p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-2 md:mb-3">
                <HomeIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <p className="text-dark-100 font-medium text-sm md:text-base">Mi Vivienda</p>
              <p className="text-dark-500 text-xs mt-1">Administra tu hogar</p>
            </Link>
            <Link to="/reports" className="flex flex-col items-center p-3 md:p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mb-2 md:mb-3">
                <DocumentChartBarIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <p className="text-dark-100 font-medium text-sm md:text-base">Informes</p>
              <p className="text-dark-500 text-xs mt-1">Estadísticas detalladas</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}