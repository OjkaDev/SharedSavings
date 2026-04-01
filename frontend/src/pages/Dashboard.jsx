import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen de tus finanzas compartidas y personales
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
              <span className="text-white text-xl">€</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos Compartidos</p>
              <p className="text-2xl font-semibold text-gray-900">€0.00</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
              <span className="text-white text-xl">€</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos Personales</p>
              <p className="text-2xl font-semibold text-gray-900">€0.00</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-500">
              <span className="text-white text-xl">!</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">€0.00</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Viviendas</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h2>
          <p className="text-gray-500 text-sm">
            No hay actividad reciente. Comienza añadiendo tus primeros gastos.
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Accesos Rápidos</h2>
          <div className="space-y-3">
            <Link to="/shared-expenses" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">➕ Añadir gasto compartido</span>
            </Link>
            <Link to="/personal" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">➕ Registrar gasto personal</span>
            </Link>
            <Link to="/household" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">🏠 Gestionar vivienda</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
