import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [status, setStatus] = useState('verifying') // verifying, ready, success, error
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      // Supabase client auto-detects hash tokens and establishes session
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setStatus('ready')
        return
      }

      // Listen for auth state change (when Supabase processes hash tokens)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setStatus('ready')
          }
        }
      )

      // Timeout after 5 seconds if no session established
      setTimeout(() => {
        subscription.unsubscribe()
        setStatus('error')
      }, 5000)

      return () => subscription.unsubscribe()
    }

    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      setStatus('success')
      await supabase.auth.signOut()
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="glass rounded-3xl p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-2">
                Verificando enlace...
              </h2>
              <p className="text-dark-400 text-sm">
                Por favor, espera mientras verificamos tu enlace.
              </p>
            </div>
          )}

          {status === 'ready' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-dark-50">
                  Nueva Contraseña
                </h2>
                <p className="mt-2 text-dark-400 text-sm">
                  Ingresa tu nueva contraseña
                </p>
              </div>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                      Nueva Contraseña
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
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-400 hover:text-dark-200"
                        tabIndex={-1}
                      >
                        {showConfirmPassword
                          ? <EyeSlashIcon className="h-5 w-5" />
                          : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-2">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-dark-400 text-sm mb-6">
                Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión en unos segundos.
              </p>
              <Link
                to="/login"
                className="btn-primary w-full py-3 text-base inline-block"
              >
                Ir a Iniciar Sesión
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-2">
                Enlace inválido o expirado
              </h2>
              <p className="text-dark-400 text-sm mb-6">
                El enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.
              </p>
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="btn-primary w-full py-3 text-base inline-block"
                >
                  Solicitar Nuevo Enlace
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary w-full py-3 text-base inline-block"
                >
                  Volver a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
