import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
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

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [householdRes, debtsRes, expensesRes] = await Promise.all([
        api.get(`/households/${id}`),
        api.get(`/households/${id}/debts`),
        api.get(`/expenses?household_id=${id}`),
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
        <p className="text-gray-500">Vivienda no encontrada</p>
        <Link to="/household" className="text-primary-600 hover:text-primary-500">
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
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{household.name}</h1>
          <p className="text-sm text-gray-500">
            {household.members?.length || 0} miembros
          </p>
        </div>
      </div>

      {/* Resumen de deudas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center">
            <ArrowTrendingDownIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-red-600 font-medium">Tú debes</p>
              <p className="text-2xl font-bold text-red-700">
                €{(debts?.you_owe || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Te deben</p>
              <p className="text-2xl font-bold text-green-700">
                €{(debts?.you_are_owed || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`card border ${
            (debts?.balance || 0) >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-center">
            <UserGroupIcon className={`h-8 w-8 mr-3 ${
              (debts?.balance || 0) >= 0 ? 'text-blue-500' : 'text-orange-500'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                (debts?.balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>Balance</p>
              <p className={`text-2xl font-bold ${
                (debts?.balance || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                €{(debts?.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón marcar todas como pagadas */}
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

      {/* Deudas por miembro */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Deudas por miembro</h2>
        {debts?.debts?.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay deudas pendientes</p>
        ) : (
          <div className="space-y-3">
            {debts?.debts?.map((debt) => (
              <div
                key={debt.user_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium mr-3">
                    {debt.user_name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{debt.user_name}</p>
                    <p className="text-sm text-gray-500">{debt.user_email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${
                      debt.amount_owed > 0
                        ? 'text-green-600'
                        : debt.amount_owed < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
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

      {/* Gastos compartidos */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Gastos compartidos</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay gastos compartidos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pagado por
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Importe
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {expense.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {expense.paid_by_user?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                      €{parseFloat(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {expense.paid_by === user?.id && (
                        <button
                          onClick={() => handleUnshare(expense.id)}
                          className="text-amber-500 hover:text-amber-600 transition text-sm"
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
