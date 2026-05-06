import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login, resendVerification } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setResendSuccess(false)
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'EMAIL_NOT_CONFIRMED') {
        setError('Tu email no ha sido verificado. Por favor, revisa tu correo y haz clic en el enlace de verificación.')
        setShowResend(true)
      } else {
        setError(detail || 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      await resendVerification(email)
      setResendSuccess(true)
      setShowResend(false)
    } catch (err) {
      setError('Error al reenviar el correo de verificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="glass rounded-3xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-dark-50">
              SharedSavings
            </h2>
            <p className="mt-2 text-dark-400 text-sm">
              Inicia sesión en tu cuenta
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="block mt-2 text-primary-400 hover:text-primary-300 underline text-sm"
                  >
                    Reenviar correo de verificación
                  </button>
                )}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
                Correo de verificación enviado. Revisa tu bandeja de entrada.
              </div>
            )}

            <div className="space-y-4">
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
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-400 hover:text-dark-200"
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <EyeSlashIcon className="h-5 w-5" />
                      : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>

            <div className="text-center space-y-2">
              <Link to="/forgot-password" className="text-dark-400 hover:text-dark-300 text-sm transition-colors block">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/register" className="text-primary-400 hover:text-primary-300 text-sm transition-colors block">
                ¿No tienes cuenta? Regístrate
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
