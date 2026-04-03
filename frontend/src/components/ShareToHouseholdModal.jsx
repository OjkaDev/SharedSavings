import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

export default function ShareToHouseholdModal({ isOpen, onClose, onSubmit, selectedExpenses }) {
  const [households, setHouseholds] = useState([])
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [step, setStep] = useState(1) // 1: seleccionar vivienda, 2: configurar división
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
      // Inicializar configuración de splits
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Compartir Gastos a Vivienda
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Gastos seleccionados: <strong>{selectedExpenses.length}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Total: <strong>€{totalAmount.toFixed(2)}</strong>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar vivienda
              </label>
              {households.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No tienes viviendas. Crea una primero.
                </p>
              ) : (
                <div className="space-y-2">
                  {households.map((household) => (
                    <label
                      key={household.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                        selectedHousehold?.id === household.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="household"
                        checked={selectedHousehold?.id === household.id}
                        onChange={() => setSelectedHousehold(household)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{household.name}</p>
                        <p className="text-sm text-gray-500">
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
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Vivienda: <strong>{selectedHousehold?.name}</strong>
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {selectedExpenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        €{parseFloat(expense.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`split-${expense.id}`}
                        checked={splitConfigs[expense.id]?.split_type === 'equal'}
                        onChange={() => handleSplitTypeChange(expense.id, 'equal')}
                        className="mr-2"
                      />
                      <span className="text-sm">Partes iguales</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`split-${expense.id}`}
                        checked={splitConfigs[expense.id]?.split_type === 'percentage'}
                        onChange={() => handleSplitTypeChange(expense.id, 'percentage')}
                        className="mr-2"
                      />
                      <span className="text-sm">Porcentajes personalizados</span>
                    </label>

                    {splitConfigs[expense.id]?.split_type === 'percentage' && (
                      <div className="ml-6 space-y-2 mt-2">
                        {splitConfigs[expense.id]?.splits?.map((split) => {
                          const member = members.find((m) => m.id === split.user_id)
                          return (
                            <div key={split.user_id} className="flex items-center space-x-2">
                              <span className="text-sm w-24">
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
                              <span className="text-sm text-gray-500">%</span>
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
