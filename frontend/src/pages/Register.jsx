import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEmailExists(false)

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
      await register(email, password, name)
      setRegistered(true)
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (detail === 'EMAIL_ALREADY_EXISTS' || 
          detail.toLowerCase().includes('already registered') || 
          detail.toLowerCase().includes('user already')) {
        setEmailExists(true)
      } else {
        setError(detail || 'Error al registrarse')
      }
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="glass rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-2">
                ¡Revisa tu correo!
              </h2>
              <p className="text-dark-400 text-sm mb-6">
                Hemos enviado un enlace de verificación a <span className="text-primary-400 font-medium">{email}</span>.
                Haz clic en el enlace para activar tu cuenta.
              </p>
              <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
                <p className="text-dark-300 text-xs">
                  ¿No recibiste el correo? Revisa tu carpeta de spam o correo no deseado.
                </p>
              </div>
              <Link
                to="/login"
                className="btn-primary w-full py-3 text-base inline-block"
              >
                Ir a Iniciar Sesión
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
              SharedSavings
            </h2>
            <p className="mt-2 text-dark-400 text-sm">
              Crea tu cuenta gratuita
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {emailExists && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl text-sm">
                <p className="font-medium mb-2">Este correo ya está registrado</p>
                <p className="text-yellow-400/80 text-xs mb-3">
                  Ya existe una cuenta con el email <span className="font-medium">{email}</span>.
                </p>
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="text-yellow-300 hover:text-yellow-200 underline text-xs"
                  >
                    Iniciar sesión
                  </Link>
                  <span className="text-yellow-400/50 text-xs">o</span>
                  <Link
                    to={`/forgot-password?email=${encodeURIComponent(email)}`}
                    className="text-yellow-300 hover:text-yellow-200 underline text-xs"
                  >
                    Recuperar contraseña
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-2">
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Tu nombre"
                />
              </div>
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
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
