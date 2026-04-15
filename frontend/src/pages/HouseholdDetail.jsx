import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import DateFilter from '../components/DateFilter'
import { getCurrentMonth, getMonthRange } from '../utils/dateUtils'
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
      await api.put(`/households/${id}/pay-all`)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
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
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-red-500/10 border-red-500/30">
          <div className="flex items-center">
            <div className="p-2 bg-red-500/20 rounded-xl mr-3">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-400 font-medium">Tú debes</p>
              <p className="text-2xl font-bold text-red-400">
                €{(debts?.you_owe || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-green-500/10 border-green-500/30">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/20 rounded-xl mr-3">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-400 font-medium">Te deben</p>
              <p className="text-2xl font-bold text-green-400">
                €{(debts?.you_are_owed || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className={`card border ${
          (debts?.balance || 0) >= 0
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-xl mr-3 ${
              (debts?.balance || 0) >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'
            }`}>
              <UserGroupIcon className={`h-6 w-6 ${
                (debts?.balance || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'
              }`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${
                (debts?.balance || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'
              }`}>Balance</p>
              <p className={`text-2xl font-bold ${
                (debts?.balance || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'
              }`}>
                €{(debts?.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(debts?.you_owe || 0) > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handlePayAll}
            disabled={payingAll}
            className="btn-primary inline-flex items-center"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            {payingAll ? 'Procesando...' : 'Marcar todas como pagadas'}
          </button>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-medium text-dark-100 mb-4">Deudas por miembro</h2>
        {debts?.debts?.length === 0 ? (
          <p className="text-dark-400 text-sm">No hay deudas pendientes</p>
        ) : (
          <div className="space-y-3">
            {debts?.debts?.map((debt) => (
              <div
                key={debt.user_id}
                className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-dark-700/50"
              >
                <div className="flex items-center">
                  <span className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center text-dark-200 font-medium mr-3">
                    {debt.user_name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <p className="font-medium text-dark-100">{debt.user_name}</p>
                    <p className="text-sm text-dark-400">{debt.user_email}</p>
                  </div>
                </div>
                <div className="text-right">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-dark-100 mb-4">Gastos compartidos</h2>
        {expenses.length === 0 ? (
          <p className="text-dark-400 text-sm">No hay gastos compartidos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="table-header py-3">Fecha</th>
                  <th className="table-header py-3">Descripción</th>
                  <th className="table-header py-3">Pagado por</th>
                  <th className="table-header py-3 text-right">Importe</th>
                  <th className="table-header py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {expenses.map((expense) => (
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
                    <td className="table-cell text-right">
                      {expense.paid_by === user?.id && (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}