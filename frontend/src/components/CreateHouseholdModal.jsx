import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function CreateHouseholdModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onSubmit({ name })
      setName('')
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la vivienda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="card max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-100">Nueva Vivienda</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200 transition">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Nombre de la vivienda
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ej: Piso Madrid"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creando...' : 'Crear Vivienda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}