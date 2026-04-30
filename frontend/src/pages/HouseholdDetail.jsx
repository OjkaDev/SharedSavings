import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import DateFilter from '../components/DateFilter'
import LoadingSpinner from '../components/LoadingSpinner'
import { getCurrentMonth, getMonthRange, getPeriodLabel } from '../utils/dateUtils'
import {
  ArrowLeftIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function HouseholdDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [household, setHousehold] = useState(null)
  const [debts, setDebts] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingAll, setPayingAll] = useState(false)
  const [dateRange, setDateRange] = useState(() => getMonthRange(getCurrentMonth().month, getCurrentMonth().year))

  useEffect(() => {
    fetchData()
  }, [id, dateRange])

  const fetchData = async () => {
    try {
      const [householdRes, debtsRes, expensesRes] = await Promise.all([
        api.get(`/households/${id}`),
        api.get(`/households/${id}/debts`, { params: dateRange }),
        api.get(`/expenses`, { params: { household_id: id, ...dateRange } }),
      ])
      setHousehold(householdRes.data)
      setDebts(debtsRes.data)
      setExpenses(expensesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayAll = async () => {
    if (!confirm('¿Marcar todas las deudas como pagadas?')) return

    setPayingAll(true)
    try {
      await api.put(`/households/${id}/pay`)
      await fetchData()
    } catch (error) {
      console.error('Error paying all:', error)
      alert('Error al marcar pagos')
    } finally {
      setPayingAll(false)
    }
  }

  const handleUnshare = async (expenseId) => {
    if (!confirm('¿Descompartir este gasto? Se eliminará de la vivienda.')) return
    try {
      await api.delete(`/expenses/${expenseId}/unshare`)
      await fetchData()
    } catch (error) {
      console.error('Error unsharing:', error)
      alert('Error al descompartir')
    }
  }

  const handlePayMember = async (memberId) => {
    if (!confirm('¿Marcar deuda como pagada?')) return
    try {
      await api.put(`/households/${id}/pay`, { user_id: memberId })
      await fetchData()
    } catch (error) {
      console.error('Error paying member:', error)
      alert('Error al marcar pago')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!household) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Vivienda no encontrada</p>
        <Link to="/household" className="text-primary-400 hover:text-primary-300">
          Volver a viviendas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/household"
          className="text-dark-500 hover:text-dark-300 transition"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="heading">{household.name}</h1>
          <p className="subheading mt-1">
            {household.members?.length || 0} miembros
          </p>
        </div>
      </div>

      <DateFilter onChange={setDateRange} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            name: 'Tú debes',
            value: `€${(debts?.you_owe || 0).toFixed(2)}`,
            icon: ArrowTrendingDownIcon,
            gradient: 'from-red-400 to-rose-500',
          },
          {
            name: 'Te deben',
            value: `€${(debts?.you_are_owed || 0).toFixed(2)}`,
            icon: ArrowTrendingUpIcon,
            gradient: 'from-green-400 to-emerald-500',
          },
          {
            name: 'Balance',
            value: `€${(debts?.balance || 0).toFixed(2)}`,
            icon: UserGroupIcon,
            gradient: (debts?.balance || 0) >= 0 ? 'from-cyan-400 to-blue-500' : 'from-orange-400 to-red-500',
          },
          {
            name: 'Miembros',
            value: household.members?.length || 0,
            icon: UserGroupIcon,
            gradient: 'from-purple-400 to-indigo-500',
          },
        ].map((stat) => (
          <div key={stat.name} className="card p-3 md:p-5 flex flex-col text-center">
            <p className="text-dark-300 text-xs md:text-sm font-medium mb-2 md:mb-3">{stat.name}</p>
            <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
              </div>
              <p className="text-lg md:text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <p className="text-dark-500 text-xs">Total {getPeriodLabel(dateRange)}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-dark-50">Deudas por miembro</h2>
          {(debts?.you_owe || 0) > 0 && (
            <button
              onClick={handlePayAll}
              disabled={payingAll}
              className="btn-primary inline-flex items-center text-sm"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {payingAll ? 'Procesando...' : 'Pagar todo'}
            </button>
          )}
        </div>
        {debts?.debts?.length === 0 ? (
          <p className="text-dark-400 text-sm py-4 text-center">No hay deudas pendientes</p>
        ) : (
          <div className="space-y-3">
            {debts?.debts?.map((debt) => (
              <div
                key={debt.user_id}
                className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-dark-700/50 hover:border-dark-600/50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-medium mr-3">
                    {debt.user_name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <p className="font-medium text-dark-100">{debt.user_name}</p>
                    <p className="text-xs text-dark-500">{debt.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={`text-lg font-semibold ${
                      debt.amount_owed > 0
                        ? 'text-green-400'
                        : debt.amount_owed < 0
                        ? 'text-red-400'
                        : 'text-dark-400'
                    }`}
                  >
                    {debt.amount_owed > 0
                      ? `Te debe €${debt.amount_owed.toFixed(2)}`
                      : debt.amount_owed < 0
                      ? `Le debes €${Math.abs(debt.amount_owed).toFixed(2)}`
                      : 'Saldado'}
                  </p>
                  {debt.amount_owed < 0 && (
                    <button
                      onClick={() => handlePayMember(debt.user_id)}
                      className="btn-secondary inline-flex items-center text-xs py-1.5 px-3"
                      title="Marcar como pagado"
                    >
                      <CheckIcon className="h-3.5 w-3.5 mr-1" />
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-dark-50 mb-4 md:mb-6">Gastos compartidos</h2>
        {expenses.length === 0 ? (
          <p className="text-dark-400 text-sm py-4 text-center">No hay gastos compartidos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="table-header py-3">Fecha</th>
                  <th className="table-header py-3">Descripción</th>
                  <th className="table-header py-3">Pagado por</th>
                  <th className="table-header py-3 text-right">Importe</th>
                  <th className="table-header py-3 text-right">Mi parte</th>
                  <th className="table-header py-3 text-center">Estado</th>
                  <th className="table-header py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {expenses.map((expense) => {
                  const mySplit = expense.splits?.find(s => s.user_id === user?.id)
                  const nonPayerSplits = expense.splits?.filter(s => s.user_id !== expense.paid_by) || []
                  const unpaidCount = nonPayerSplits.filter(s => !s.paid).length
                  const totalNonPayer = nonPayerSplits.length
                  const isSettled = unpaidCount === 0 && totalNonPayer > 0
                  const isPending = unpaidCount === totalNonPayer
                  return (
                    <tr key={expense.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="table-cell">
                        {new Date(expense.date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="table-cell font-medium max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="table-cell">
                        {expense.paid_by_user?.name || '-'}
                      </td>
                      <td className="table-cell font-semibold text-right text-primary-400">
                        €{parseFloat(expense.amount).toFixed(2)}
                      </td>
                      <td className="table-cell font-semibold text-right text-orange-400">
                        {mySplit ? `€${parseFloat(mySplit.amount).toFixed(2)}` : '-'}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`badge ${
                          isSettled
                            ? 'badge-success'
                            : isPending
                            ? 'badge-warning'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {isSettled ? 'Pagado' : isPending ? 'Pendiente' : 'Parcial'}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        {expense.paid_by === user?.id && !isSettled && (
                          <button
                            onClick={() => handleUnshare(expense.id)}
                            className="text-yellow-400 hover:text-yellow-300 transition"
                            title="Descompartir gasto"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}