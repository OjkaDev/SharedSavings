import { useState, useEffect } from 'react'
import api from '../services/api'
import ShareToHouseholdModal from '../components/ShareToHouseholdModal'
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShareIcon,
  TrashIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'

export default function PersonalFinances() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 })
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes, summaryRes] = await Promise.all([
        api.get('/personal/expenses'),
        api.get('/categories'),
        api.get('/personal/summary'),
      ])
      setTransactions(transactionsRes.data)
      setCategories(categoriesRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/personal/expenses', formData)
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error creating transaction:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
    })
  }

  const deleteTransaction = async (id) => {
    const transaction = transactions.find((t) => t.id === id)
    if (transaction?.shared_expense_id) {
      alert('Este gasto fue compartido. Descompártelo primero.')
      return
    }
    if (!confirm('¿Estás seguro de eliminar este registro?')) return
    try {
      await api.delete(`/personal/expenses/${id}`)
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
      fetchData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert(error.response?.data?.detail || 'Error al eliminar')
    }
  }

  const unshareExpense = async (sharedExpenseId) => {
    if (!confirm('¿Descompartir este gasto? Se eliminará de la vivienda.')) return
    try {
      await api.delete(`/expenses/${sharedExpenseId}/unshare`)
      fetchData()
    } catch (error) {
      console.error('Error unsharing expense:', error)
      alert('Error al descompartir')
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map((t) => t.id))
    }
  }

  const handleShare = async (shareData) => {
    await api.post('/expenses/share', shareData)
    setSelectedIds([])
    fetchData()
  }

  const selectedTransactions = transactions.filter(
    (t) => selectedIds.includes(t.id) && t.type === 'expense'
  )

  const hasIncomesSelected = selectedIds.some(
    (id) => transactions.find((t) => t.id === id)?.type === 'income'
  )

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
          <h1 className="text-2xl font-semibold text-gray-900">Finanzas Personales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tus ingresos y gastos
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowShareModal(true)}
              disabled={selectedTransactions.length === 0}
              className={`btn-secondary inline-flex items-center ${
                selectedTransactions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Compartir ({selectedTransactions.length})
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center">
            <ArrowUpIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-600 font-medium">Ingresos</p>
              <p className="text-2xl font-bold text-green-700">
                €{summary.income.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center">
            <ArrowDownIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-red-600 font-medium">Gastos</p>
              <p className="text-2xl font-bold text-red-700">
                €{summary.expenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`card border ${
            summary.balance >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                summary.balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'
              }`}
            >
              <span className="text-white font-bold">€</span>
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                Balance
              </p>
              <p
                className={`text-2xl font-bold ${
                  summary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}
              >
                €{summary.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Historial de Transacciones
          </h2>
          {hasIncomesSelected && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Los ingresos no se pueden compartir
            </span>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay transacciones registradas. Comienza añadiendo tus ingresos y gastos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === transactions.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
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
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`hover:bg-gray-50 ${
                      selectedIds.includes(transaction.id) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(transaction.id)}
                        onChange={() => toggleSelect(transaction.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                      <div className="flex items-center">
                        {transaction.description || '-'}
                        {transaction.shared_expense_id && (
                          <span className="ml-2 text-primary-500" title="Gasto compartido">
                            🏠
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {transaction.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold text-right ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}€
                      {parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        {transaction.shared_expense_id && (
                          <button
                            onClick={() => unshareExpense(transaction.shared_expense_id)}
                            className="text-amber-500 hover:text-amber-600 transition"
                            title="Descompartir"
                          >
                            <HomeIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className={`transition ${
                            transaction.shared_expense_id
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                          disabled={!!transaction.shared_expense_id}
                          title={transaction.shared_expense_id ? 'Descomparte primero' : 'Eliminar'}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear transacción */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Nuevo Registro</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mr-2"
                      />
                      Gasto
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mr-2"
                      />
                      Ingreso
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importe (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="input-field"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field"
                    placeholder="Ej: Supermercado"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal compartir */}
      <ShareToHouseholdModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSubmit={handleShare}
        selectedExpenses={selectedTransactions}
      />
    </div>
  )
}
