import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function InviteMemberModal({ isOpen, onClose, onSubmit, household }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen || !household) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await onSubmit(household.id, email)
      setSuccess(`Invitación enviada a ${email}`)
      setEmail('')
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="card max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-100">
            Invitar a {household.name}
          </h2>
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

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm mb-4">
              {success}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Email del invitado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="email@ejemplo.com"
              required
              autoFocus
            />
            <p className="text-xs text-dark-500 mt-2">
              El usuario debe estar registrado en SharedSavings
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}