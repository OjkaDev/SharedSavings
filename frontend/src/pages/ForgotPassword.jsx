import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="glass rounded-3xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-2">
                ¡Revisa tu correo!
              </h2>
              <p className="text-dark-400 text-sm mb-6">
                Hemos enviado un enlace para restablecer tu contraseña a <span className="text-primary-400 font-medium">{email}</span>.
              </p>
              <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
                <p className="text-dark-300 text-xs">
                  ¿No recibiste el correo? Revisa tu carpeta de spam o correo no deseado.
                  El enlace expira en 1 hora.
                </p>
              </div>
              <Link
                to="/login"
                className="btn-primary w-full py-3 text-base inline-block"
              >
                Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-dark-50">
              Recuperar Contraseña
            </h2>
            <p className="mt-2 text-dark-400 text-sm">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@email.com"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
