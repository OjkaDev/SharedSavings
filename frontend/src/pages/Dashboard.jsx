import { useState, useEffect } from 'react'
import { useFetch } from '../hooks/useFetch'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Modal from '../components/Modal'
import { HomeIcon, WalletIcon, CurrencyDollarIcon, ClockIcon, ArrowTrendingUpIcon, PlusIcon, DocumentChartBarIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import { getCurrentMonth, getMonthRange, MONTHS } from '../utils/dateUtils'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
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
  const { loading, run } = useFetch()
  const [summary, setSummary] = useState({
    personalIncome: 0,
    personalExpenses: 0,
    sharedTotal: 0,
    sharedPending: 0,
    households: 0,
  })
  const [households, setHouseholds] = useState([])
  const [quickAccessIds, setQuickAccessIds] = useState(() => {
    const saved = localStorage.getItem('quickAccessHouseholds')
    return saved ? JSON.parse(saved) : []
  })
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    localStorage.setItem('quickAccessHouseholds', JSON.stringify(quickAccessIds))
  }, [quickAccessIds])

  const fetchData = () => run(async () => {
    const { month, year } = getCurrentMonth()
    const { start_date, end_date } = getMonthRange(month, year)

    const [personalRes, sharedRes, householdsRes] = await Promise.all([
      api.get('/personal/summary', { params: { start_date, end_date } }),
      api.get('/expenses/summary', { params: { start_date, end_date } }),
      api.get('/households'),
    ])

    setSummary({
      personalIncome: personalRes.data.income || 0,
      personalExpenses: personalRes.data.expenses || 0,
      sharedTotal: sharedRes.data.total || 0,
      sharedPending: sharedRes.data.pending || 0,
      households: householdsRes.data.length || 0,
    })
    setHouseholds(householdsRes.data)
  })

  if (loading) {
    return <LoadingSpinner />
  }

  const stats = [
    { 
      name: 'Grupos', 
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

  const addQuickAccess = (householdId) => {
    if (quickAccessIds.length < 3 && !quickAccessIds.includes(householdId)) {
      setQuickAccessIds([...quickAccessIds, householdId])
    }
    setShowHouseholdDropdown(false)
  }

  const removeQuickAccess = (householdId) => {
    setQuickAccessIds(quickAccessIds.filter(id => id !== householdId))
  }

  const quickAccessHouseholds = households.filter(h => quickAccessIds.includes(h.id))
  const availableHouseholds = households.filter(h => !quickAccessIds.includes(h.id))

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
    <>
    <div className="space-y-8">
      <div>
        <h1 className="heading">Dashboard</h1>
        <p className="subheading mt-1">
          Resumen de tus finanzas de este mes
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            icon={stat.icon}
            gradient={stat.gradient}
            subtitle={`Total de ${monthName}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Resumen Financiero unificado */}
        <div className="card p-4 md:p-6 order-last lg:order-none">
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
        <div className="card p-6 order-first lg:order-none">
          <h2 className="text-lg font-semibold text-dark-50 mb-6">Accesos Rápidos</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
            <Link to="/personal?action=new" className="flex-shrink-0 w-28 lg:w-auto flex flex-col items-center p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-2">
                <PlusIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-dark-100 font-medium text-sm">Nuevo Gasto</p>
              <p className="text-dark-500 text-xs mt-1">Registra un gasto</p>
            </Link>
            {quickAccessHouseholds.map((household) => (
              <div key={household.id} className="flex-shrink-0 w-28 lg:w-auto relative flex flex-col items-center p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
                <button
                  onClick={() => removeQuickAccess(household.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-dark-700 hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition"
                  title="Quitar de accesos rápidos"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                <Link to={`/household/${household.id}`} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-2">
                    <HomeIcon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-dark-100 font-medium text-sm truncate max-w-full">{household.name}</p>
                  <p className="text-dark-500 text-xs mt-1">{household.members?.length || 0} miembros</p>
                </Link>
              </div>
            ))}
            {quickAccessIds.length < 3 && availableHouseholds.length > 0 && (
              <div className="flex-shrink-0 w-28 lg:w-auto">
                <button
                  onClick={() => setShowHouseholdDropdown(true)}
                  className="flex flex-col items-center p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dashed border-dark-600 hover:border-primary-500/30 transition-all group text-center w-full"
                >
                  <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center mb-2">
                    <PlusIcon className="h-5 w-5 text-dark-400" />
                  </div>
                  <p className="text-dark-400 font-medium text-sm">Añadir Grupo</p>
                  <p className="text-dark-500 text-xs mt-1">{availableHouseholds.length} disponibles</p>
                </button>
              </div>
            )}
            <Link to="/reports" className="flex-shrink-0 w-28 lg:w-auto flex flex-col items-center p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mb-2">
                <DocumentChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-dark-100 font-medium text-sm">Informes</p>
              <p className="text-dark-500 text-xs mt-1">Estadísticas detalladas</p>
            </Link>
            <Link to="/settings?tab=categorias" className="flex-shrink-0 w-28 lg:w-auto flex flex-col items-center p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 border border-dark-700/50 hover:border-primary-500/30 transition-all group text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-2">
                <TagIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-dark-100 font-medium text-sm">Categorías</p>
              <p className="text-dark-500 text-xs mt-1">Gestionar categorías</p>
            </Link>
          </div>
        </div>
      </div>
    </div>

    <Modal
      isOpen={showHouseholdDropdown}
      onClose={() => setShowHouseholdDropdown(false)}
      title="Añadir Grupo"
    >
      <div className="space-y-2">
        {availableHouseholds.map((household) => (
          <button
            key={household.id}
            onClick={() => addQuickAccess(household.id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-dark-700 transition rounded-xl text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
              <HomeIcon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-dark-100 text-sm font-medium truncate">{household.name}</p>
              <p className="text-dark-500 text-xs">{household.members?.length || 0} miembros</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
    </>
  )
}