import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error

  useEffect(() => {
    const checkSession = async () => {
      // Supabase client auto-detects hash tokens and establishes session
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setStatus('success')
        setTimeout(() => {
          navigate('/')
        }, 2000)
        return
      }

      // Listen for auth state change (when Supabase processes hash tokens)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            setStatus('success')
            setTimeout(() => {
              navigate('/')
            }, 2000)
          }
        }
      )

      // Timeout after 5 seconds if no session established
      setTimeout(() => {
        subscription.unsubscribe()
        if (!session) {
          setStatus('error')
        }
      }, 5000)

      return () => subscription.unsubscribe()
    }

    checkSession()
  }, [navigate])

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
                Verificando correo...
              </h2>
              <p className="text-dark-400 text-sm">
                Por favor, espera mientras verificamos tu correo electrónico.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-2">
                ¡Correo verificado!
              </h2>
              <p className="text-dark-400 text-sm mb-6">
                Tu cuenta ha sido activada correctamente. Serás redirigido al inicio en unos segundos.
              </p>
              <Link
                to="/"
                className="btn-primary w-full py-3 text-base inline-block"
              >
                Ir al Dashboard
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
                Error de verificación
              </h2>
              <p className="text-dark-400 text-sm mb-6">
                No se pudo verificar tu correo. El enlace puede haber expirado.
              </p>
              <div className="space-y-3">
                <Link
                  to="/register"
                  className="btn-primary w-full py-3 text-base inline-block"
                >
                  Registrarse de nuevo
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary w-full py-3 text-base inline-block"
                >
                  Ir a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
