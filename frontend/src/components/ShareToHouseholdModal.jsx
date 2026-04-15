import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

export default function ShareToHouseholdModal({ isOpen, onClose, onSubmit, selectedExpenses }) {
  const [households, setHouseholds] = useState([])
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [members, setMembers] = useState([])
  const [splitConfigs, setSplitConfigs] = useState({})

  useEffect(() => {
    if (isOpen) {
      fetchHouseholds()
      setStep(1)
      setSelectedHousehold(null)
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedHousehold) {
      fetchMembers(selectedHousehold.id)
    }
  }, [selectedHousehold])

  const fetchHouseholds = async () => {
    try {
      const response = await api.get('/households')
      setHouseholds(response.data)
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  const fetchMembers = async (householdId) => {
    try {
      const response = await api.get(`/households/${householdId}`)
      setMembers(response.data.members || [])
      const configs = {}
      selectedExpenses.forEach((exp) => {
        configs[exp.id] = {
          split_type: 'equal',
          splits: response.data.members.map((m) => ({
            user_id: m.id,
            percentage: 100 / response.data.members.length,
          })),
        }
      })
      setSplitConfigs(configs)
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const handleContinue = () => {
    if (!selectedHousehold) {
      setError('Selecciona una vivienda')
      return
    }
    setStep(2)
    setError('')
  }

  const handleSplitTypeChange = (expenseId, splitType) => {
    setSplitConfigs((prev) => ({
      ...prev,
      [expenseId]: {
        ...prev[expenseId],
        split_type: splitType,
        splits: splitType === 'equal'
          ? members.map((m) => ({ user_id: m.id, percentage: 100 / members.length }))
          : prev[expenseId]?.splits || [],
      },
    }))
  }

  const handlePercentageChange = (expenseId, userId, value) => {
    setSplitConfigs((prev) => {
      const config = prev[expenseId]
      const newSplits = config.splits.map((s) =>
        s.user_id === userId ? { ...s, percentage: parseFloat(value) || 0 } : s
      )
      return {
        ...prev,
        [expenseId]: { ...config, splits: newSplits },
      }
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const expenses = selectedExpenses.map((exp) => ({
        expense_id: exp.id,
        split_type: splitConfigs[exp.id]?.split_type || 'equal',
        splits: splitConfigs[exp.id]?.splits || [],
      }))

      await onSubmit({
        household_id: selectedHousehold.id,
        expenses,
      })

      setSuccess('Gastos compartidos correctamente')
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al compartir gastos')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const totalAmount = selectedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  return (
    <div className="modal-overlay">
      <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-100">
            Compartir Gastos a Vivienda
          </h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200 transition">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm mb-4">
            {success}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="mb-6 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50">
              <p className="text-dark-300 text-sm mb-1">
                Gastos seleccionados: <span className="text-dark-100 font-medium">{selectedExpenses.length}</span>
              </p>
              <p className="text-dark-300 text-sm">
                Total: <span className="text-primary-400 font-medium">€{totalAmount.toFixed(2)}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Seleccionar vivienda
              </label>
              {households.length === 0 ? (
                <p className="text-dark-400 text-sm">
                  No tienes viviendas. Crea una primero.
                </p>
              ) : (
                <div className="space-y-2">
                  {households.map((household) => (
                    <label
                      key={household.id}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition ${
                        selectedHousehold?.id === household.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-dark-600 bg-dark-800/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="household"
                        checked={selectedHousehold?.id === household.id}
                        onChange={() => setSelectedHousehold(household)}
                        className="mr-3 accent-primary-500"
                      />
                      <div>
                        <p className="font-medium text-dark-100">{household.name}</p>
                        <p className="text-sm text-dark-400">
                          {household.members?.length || 0} miembros
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={onClose} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedHousehold}
                className="btn-primary"
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-6 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50">
              <p className="text-dark-300 text-sm">
                Vivienda: <span className="text-dark-100 font-medium">{selectedHousehold?.name}</span>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {selectedExpenses.map((expense) => (
                <div key={expense.id} className="border border-dark-700 rounded-xl p-4 bg-dark-800/30">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-medium text-dark-100">{expense.description || 'Sin descripción'}</p>
                      <p className="text-sm text-primary-400">
                        €{parseFloat(expense.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`split-${expense.id}`}
                        checked={splitConfigs[expense.id]?.split_type === 'equal'}
                        onChange={() => handleSplitTypeChange(expense.id, 'equal')}
                        className="mr-3 accent-primary-500"
                      />
                      <span className="text-dark-300 text-sm">Partes iguales</span>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`split-${expense.id}`}
                        checked={splitConfigs[expense.id]?.split_type === 'percentage'}
                        onChange={() => handleSplitTypeChange(expense.id, 'percentage')}
                        className="mr-3 accent-primary-500"
                      />
                      <span className="text-dark-300 text-sm">Porcentajes personalizados</span>
                    </label>

                    {splitConfigs[expense.id]?.split_type === 'percentage' && (
                      <div className="ml-6 space-y-2 mt-3 p-3 bg-dark-800/50 rounded-lg">
                        {splitConfigs[expense.id]?.splits?.map((split) => {
                          const member = members.find((m) => m.id === split.user_id)
                          return (
                            <div key={split.user_id} className="flex items-center space-x-3">
                              <span className="text-sm text-dark-300 w-28">
                                {member?.name || member?.email}:
                              </span>
                              <input
                                type="number"
                                value={split.percentage}
                                onChange={(e) =>
                                  handlePercentageChange(expense.id, split.user_id, e.target.value)
                                }
                                className="input-field w-20"
                                min="0"
                                max="100"
                                step="0.01"
                              />
                              <span className="text-sm text-dark-500">%</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Volver
              </button>
              <button onClick={onClose} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary inline-flex items-center"
              >
                {loading ? (
                  'Compartiendo...'
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Compartir
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}