import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  UserGroupIcon,
  WalletIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Vivienda', href: '/household', icon: UserGroupIcon },
  { name: 'Finanzas', href: '/personal', icon: WalletIcon },
  { name: 'Informes', href: '/reports', icon: ChartBarIcon },
  { name: 'Ajustes', href: '/settings', icon: Cog6ToothIcon },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="bg-dark-800/80 backdrop-blur-md border-b border-dark-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary-400">SharedSavings</span>
              </div>
              <div className="hidden sm:flex sm:gap-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={isActive ? 'nav-item-active' : 'nav-item'}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-700">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-400 text-sm font-medium">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </span>
                </div>
                <span className="text-dark-200 text-sm font-medium hidden sm:block">
                  {user?.name || user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}