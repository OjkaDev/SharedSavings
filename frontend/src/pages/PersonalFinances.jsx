import { useState, useEffect } from 'react'
import api from '../services/api'
import ShareToHouseholdModal from '../components/ShareToHouseholdModal'
import DateFilter from '../components/DateFilter'
import { getCurrentMonth, getMonthRange } from '../utils/dateUtils'
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
  const [dateRange, setDateRange] = useState(() => getMonthRange(getCurrentMonth().month, getCurrentMonth().year))
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  })

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes, summaryRes] = await Promise.all([
        api.get('/personal/expenses', { params: dateRange }),
        api.get('/categories'),
        api.get('/personal/summary', { params: dateRange }),
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
          <h1 className="heading">Finanzas Personales</h1>
          <p className="subheading mt-1">
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

      <DateFilter onChange={setDateRange} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-500/10 border-green-500/30">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/20 rounded-xl mr-3">
              <ArrowUpIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-400 font-medium">Ingresos</p>
              <p className="text-2xl font-bold text-green-400">
                €{summary.income.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-red-500/10 border-red-500/30">
          <div className="flex items-center">
            <div className="p-2 bg-red-500/20 rounded-xl mr-3">
              <ArrowDownIcon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-400 font-medium">Gastos</p>
              <p className="text-2xl font-bold text-red-400">
                €{summary.expenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className={`card border ${
            summary.balance >= 0
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
          }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-xl mr-3 ${
                summary.balance >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'
              }`}>
              <span className={`text-xl font-bold ${
                summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'
              }`}>€</span>
            </div>
            <div>
              <p className={`text-sm font-medium ${
                  summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'
                }`}>
                Balance
              </p>
              <p className={`text-2xl font-bold ${
                  summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'
                }`}>
                €{summary.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-dark-100">
            Historial de Transacciones
          </h2>
          {hasIncomesSelected && (
            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/30">
              Los ingresos no se pueden compartir
            </span>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            No hay transacciones registradas. Comienza añadiendo tus ingresos y gastos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="table-header py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === transactions.length}
                      onChange={toggleSelectAll}
                      className="rounded bg-dark-800 border-dark-600"
                    />
                  </th>
                  <th className="table-header py-3">Fecha</th>
                  <th className="table-header py-3">Descripción</th>
                  <th className="table-header py-3">Categoría</th>
                  <th className="table-header py-3">Tipo</th>
                  <th className="table-header py-3 text-right">Importe</th>
                  <th className="table-header py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`hover:bg-dark-800/50 transition-colors ${
                      selectedIds.includes(transaction.id) ? 'bg-primary-500/10' : ''
                    }`}
                  >
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(transaction.id)}
                        onChange={() => toggleSelect(transaction.id)}
                        className="rounded bg-dark-800 border-dark-600"
                      />
                    </td>
                    <td className="table-cell">
                      {new Date(transaction.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="table-cell font-medium max-w-xs truncate">
                      {transaction.description || '-'}
                    </td>
                    <td className="table-cell text-dark-300">
                      {transaction.category ? `${transaction.category.icon} ${transaction.category.name}` : '-'}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          transaction.type === 'income'
                            ? 'badge-success'
                            : 'badge-danger'
                        }`}
                      >
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td
                      className={`table-cell font-semibold text-right ${
                        transaction.type === 'income'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}€
                      {parseFloat(transaction.amount).toFixed(2)}
                      {transaction.my_share !== null && transaction.my_share !== undefined && (
                        <span className="block text-xs text-purple-400">
                          (€
                          {parseFloat(transaction.my_share).toFixed(2)} compartido)
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end space-x-2">
                        {transaction.shared_expense_id && (
                          <button
                            onClick={() => unshareExpense(transaction.shared_expense_id)}
                            className="text-yellow-400 hover:text-yellow-300 transition"
                            title="Descompartir"
                          >
                            <HomeIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className={`transition ${
                            transaction.shared_expense_id
                              ? 'text-dark-600 cursor-not-allowed'
                              : 'text-dark-400 hover:text-red-400'
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

      {showModal && (
        <div className="modal-overlay">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-6 text-dark-100">Nuevo Registro</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Tipo
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mr-2 accent-primary-500"
                      />
                      <span className="text-dark-200">Gasto</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mr-2 accent-primary-500"
                      />
                      <span className="text-dark-200">Ingreso</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
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
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Descripción <span className="text-dark-500">(opcional)</span>
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
                  <label className="block text-sm font-medium text-dark-300 mb-2">
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
                  <label className="block text-sm font-medium text-dark-300 mb-2">
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

      <ShareToHouseholdModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSubmit={handleShare}
        selectedExpenses={selectedTransactions}
      />
    </div>
  )
}