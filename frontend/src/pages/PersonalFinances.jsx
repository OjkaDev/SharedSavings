import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import ShareToHouseholdModal from '../components/ShareToHouseholdModal'
import DateFilter from '../components/DateFilter'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import { useFetch } from '../hooks/useFetch'
import { getCurrentMonth, getMonthRange, getPeriodLabel, formatLocalDate } from '../utils/dateUtils'
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  HomeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

export default function PersonalFinances() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const { loading, run } = useFetch()
  const [showModal, setShowModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0 })
  const [dateRange, setDateRange] = useState(() => getMonthRange(getCurrentMonth().month, getCurrentMonth().year))
  const [editingId, setEditingId] = useState(null)
  const [editingShared, setEditingShared] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: formatLocalDate(new Date()),
    type: 'expense',
  })

  useEffect(() => {
    fetchData()
  }, [dateRange])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowModal(true)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const fetchData = () => run(async () => {
    const [transactionsRes, categoriesRes, summaryRes] = await Promise.all([
      api.get('/personal/expenses', { params: dateRange }),
      api.get('/categories'),
      api.get('/personal/summary', { params: dateRange }),
    ])
    setTransactions(transactionsRes.data)
    setCategories(categoriesRes.data)
    setSummary(summaryRes.data)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!formData.category_id) {
      setFormError('Selecciona una categoría')
      return
    }
    try {
      if (editingId) {
        await api.put(`/personal/expenses/${editingId}`, formData)
      } else {
        await api.post('/personal/expenses', formData)
      }
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving transaction:', error)
      setFormError(error.response?.data?.detail || 'Error al guardar')
    }
  }

  const startEdit = (transaction) => {
    setEditingId(transaction.id)
    setEditingShared(!!transaction.shared_expense_id)
    setFormError('')
    setFormData({
      amount: String(transaction.amount),
      description: transaction.description || '',
      category_id: transaction.category_id ? String(transaction.category_id) : '',
      date: formatLocalDate(new Date(transaction.date)),
      type: transaction.type,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setEditingShared(false)
    setFormError('')
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      date: formatLocalDate(new Date()),
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading">Finanzas Personales</h1>
        <p className="subheading mt-1">Gestiona tus ingresos y gastos</p>
      </div>

      <DateFilter onChange={setDateRange} />

      {loading ? (
        <LoadingSpinner />
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {[
          {
            name: 'Ingresos',
            value: `€${summary.income.toFixed(2)}`,
            icon: ArrowUpIcon,
            gradient: 'from-green-400 to-emerald-500',
          },
          {
            name: 'Gastos',
            value: `€${summary.expenses.toFixed(2)}`,
            icon: ArrowDownIcon,
            gradient: 'from-red-400 to-rose-500',
          },
          {
            name: 'Balance',
            value: `€${summary.balance.toFixed(2)}`,
            icon: PlusIcon,
            gradient: summary.balance >= 0 ? 'from-cyan-400 to-blue-500' : 'from-orange-400 to-red-500',
          },
        ].map((stat) => (
          <StatCard key={stat.name} {...stat} subtitle={`Total ${getPeriodLabel(dateRange)}`} />
        ))}
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
                    <HomeIcon className="h-4 w-4 text-dark-400" />
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
                        disabled={transaction.is_debt}
                        className="rounded bg-dark-800 border-dark-600 disabled:opacity-50"
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
                          transaction.is_debt && !transaction.is_paid
                            ? 'badge-warning'
                            : transaction.is_debt && transaction.is_paid
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : transaction.is_fully_paid
                            ? 'badge-success'
                            : transaction.type === 'income'
                            ? 'badge-success'
                            : 'badge-danger'
                        }`}
                      >
                        {transaction.is_debt && !transaction.is_paid
                          ? 'Deuda'
                          : transaction.is_debt && transaction.is_paid
                          ? 'Pagado'
                          : transaction.is_fully_paid
                          ? 'Pagado'
                          : transaction.type === 'income'
                          ? 'Ingreso'
                          : 'Gasto'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold text-right ${
                        transaction.is_debt && !transaction.is_paid
                          ? 'text-orange-400'
                          : transaction.is_debt && transaction.is_paid
                          ? 'text-purple-400'
                          : transaction.type === 'income'
                          ? 'text-primary-400'
                          : 'text-red-400'
                      }`}
                    >
                      {transaction.is_debt ? (
                        <>€{parseFloat(transaction.amount).toFixed(2)}</>
                      ) : transaction.type === 'income' ? (
                        <>+€{parseFloat(transaction.amount).toFixed(2)}</>
                      ) : (
                        <>-€{parseFloat(transaction.amount).toFixed(2)}</>
                      )}
                      {!transaction.is_debt && transaction.my_share !== null && transaction.my_share !== undefined && (
                        <span className="block text-xs text-purple-400">
                          (€
                          {parseFloat(transaction.my_share).toFixed(2)} compartido)
                        </span>
                      )}
                      {transaction.is_debt && !transaction.is_paid && (
                        <span className="block text-xs text-orange-400">
                          (debes)
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end space-x-2">
                        {transaction.shared_expense_id && !transaction.is_debt && !transaction.is_fully_paid && (
                          <button
                            onClick={() => unshareExpense(transaction.shared_expense_id)}
                            className="text-yellow-400 hover:text-yellow-300 transition"
                            title="Descompartir"
                          >
                            <HomeIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(transaction)}
                          disabled={transaction.is_debt || transaction.has_paid_splits}
                          className={`transition ${
                            transaction.is_debt || transaction.has_paid_splits
                              ? 'text-dark-600 cursor-not-allowed'
                              : 'text-dark-400 hover:text-primary-400'
                          }`}
                          title={
                            transaction.is_debt
                              ? 'No puedes editar gastos de otros'
                              : transaction.has_paid_splits
                              ? 'No se puede editar: ya hay pagos realizados'
                              : 'Editar'
                          }
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className={`transition ${
                            transaction.is_debt || (transaction.shared_expense_id && transaction.is_fully_paid)
                              ? 'text-dark-600 cursor-not-allowed'
                              : transaction.shared_expense_id
                              ? 'text-dark-600 cursor-not-allowed'
                              : 'text-dark-400 hover:text-red-400'
                          }`}
                          disabled={transaction.is_debt || !!transaction.shared_expense_id}
                          title={
                            transaction.is_debt
                              ? 'No puedes eliminar gastos de otros'
                              : transaction.is_fully_paid
                              ? 'Gasto saldado, no se puede eliminar'
                              : transaction.shared_expense_id
                              ? 'Descomparte primero'
                              : 'Eliminar'
                          }
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

      </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-semibold mb-6 text-dark-100">
              {editingId ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            {editingShared && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
                💡 Para modificar el precio o tipo, descompártelo primero.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Tipo
                  </label>
                  <div className="flex space-x-6">
                    <label className={`flex items-center ${editingShared ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        disabled={editingShared}
                        className="mr-2 accent-primary-500"
                      />
                      <span className="text-dark-200">Gasto</span>
                    </label>
                    <label className={`flex items-center ${editingShared ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        disabled={editingShared}
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
                    disabled={editingShared}
                    title={editingShared ? 'Descomparte el gasto primero para cambiar el precio' : ''}
                    className={`input-field ${editingShared ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Descripción
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
                    required
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
                    required
                  >
                    <option value="" disabled>Selecciona una categoría</option>
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
              {formError && (
                <div className="mt-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {formError}
                </div>
              )}
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

      {/* FAB: Compartir o Nuevo Registro */}
      {selectedIds.length > 0 ? (
        <button
          onClick={() => setShowShareModal(true)}
          disabled={selectedTransactions.length === 0}
          className={`fab-secondary h-14 w-14 sm:w-auto sm:px-6 sm:gap-2 ${
            selectedTransactions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <HomeIcon className="h-6 w-6 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline text-sm font-semibold">
            Compartir ({selectedTransactions.length})
          </span>
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="fab h-14 w-14 sm:w-auto sm:px-6 sm:gap-2"
        >
          <PlusIcon className="h-6 w-6 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline text-sm font-semibold">Nuevo Registro</span>
        </button>
      )}
    </div>
  )
}