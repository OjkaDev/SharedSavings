import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  UserGroupIcon,
  WalletIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="bg-dark-800/80 backdrop-blur-md border-b border-dark-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="block sm:hidden p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl sm:text-2xl font-bold text-primary-400">SharedSavings</span>
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-dark-800 border-r border-dark-700 shadow-xl animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <span className="text-xl font-bold text-primary-400">SharedSavings</span>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={isActive ? 'nav-item-active' : 'nav-item'}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-primary-400 text-sm font-medium">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dark-200 text-sm font-medium truncate">
                    {user?.name || user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout()
                  closeMobileMenu()
                }}
                className="w-full nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}