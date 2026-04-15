import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { HomeIcon, WalletIcon, CurrencyDollarIcon, ClockIcon, ArrowRightIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5 flex flex-col text-center">
            <p className="text-dark-300 text-sm font-medium mb-3">{stat.name}</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <p className="text-dark-500 text-xs">Total de {monthName}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen Financiero unificado */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-dark-50 mb-6">Resumen Financiero</h2>
          <div className="flex items-center gap-8">
            {/* Quesito */}
            <div className="w-40 h-40 flex-shrink-0">
              <Doughnut data={pieData} options={pieOptions} />
            </div>
            
            {/* Métricas */}
            <div className="flex-1 space-y-4">
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
        <div className="card">
          <h2 className="text-lg font-semibold text-dark-50 mb-6">Accesos Rápidos</h2>
          <div className="space-y-3">
            <Link to="/personal" className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group">
              <span className="text-dark-200 group-hover:text-primary-400 transition-colors">Registrar gasto personal</span>
              <ArrowRightIcon className="h-5 w-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
            </Link>
            <Link to="/household" className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group">
              <span className="text-dark-200 group-hover:text-primary-400 transition-colors">Gestionar vivienda</span>
              <ArrowRightIcon className="h-5 w-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
            </Link>
            <Link to="/reports" className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group">
              <span className="text-dark-200 group-hover:text-primary-400 transition-colors">Ver informes</span>
              <ArrowRightIcon className="h-5 w-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}