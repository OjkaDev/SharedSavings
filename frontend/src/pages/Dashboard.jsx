import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    personalIncome: 0,
    personalExpenses: 0,
    sharedTotal: 0,
    sharedPending: 0,
    households: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [personalRes, sharedRes, householdsRes] = await Promise.all([
        api.get('/personal/summary', { params: { start_date: startOfMonth, end_date: endOfMonth } }),
        api.get('/expenses/summary', { params: { start_date: startOfMonth, end_date: endOfMonth } }),
        api.get('/households'),
      ])

      setSummary({
        personalIncome: personalRes.data.income || 0,
        personalExpenses: personalRes.data.expenses || 0,
        sharedTotal: sharedRes.data.total || 0,
        sharedPending: sharedRes.data.pending || 0,
        households: householdsRes.data.length || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const personalBalance = summary.personalIncome - summary.personalExpenses

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen de tus finanzas de este mes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Viviendas</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.households}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
              <span className="text-white text-xl">€</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos Compartidos</p>
              <p className="text-2xl font-semibold text-gray-900">€{summary.sharedTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-500">
              <span className="text-white text-xl">€</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos Personales</p>
              <p className="text-2xl font-semibold text-gray-900">€{summary.personalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${summary.sharedPending > 0 ? 'bg-yellow-500' : 'bg-green-500'}`}>
              <span className="text-white text-xl">{summary.sharedPending > 0 ? '!' : '✓'}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">€{summary.sharedPending.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen del mes</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Gastos compartidos</span>
              <span className="font-medium text-gray-900">€{summary.sharedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Gastos personales</span>
              <span className="font-medium text-gray-900">€{summary.personalExpenses.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total gastado</span>
              <span className="font-bold text-gray-900">€{(summary.sharedTotal + summary.personalExpenses).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Accesos Rápidos</h2>
          <div className="space-y-3">
            <Link to="/personal" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">➕ Registrar gasto personal</span>
            </Link>
            <Link to="/household" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">🏠 Gestionar vivienda</span>
            </Link>
            <Link to="/reports" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">📊 Ver informes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
