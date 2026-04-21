import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  PlusIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  UserCircleIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const EMOJI_CATEGORIES = {
  'Alimentación': ['🍕', '🛒', '🍺'],
  'Hogar': ['🏠', '💡', '🔧'],
  'Transporte': ['🚗', '⛽', '🚌'],
  'Ocio': ['🎬', '🎮', '🏋️'],
  'Servicios': ['📱', '💊', '🏥'],
  'Otros': ['💰', '🎁', '📦'],
}

const TABS = [
  { id: 'perfil', label: 'Perfil', icon: UserCircleIcon },
  { id: 'categorias', label: 'Categorías', icon: TagIcon },
]

export default function Settings() {
  const { user } = useAuth()
  const [households, setHouseholds] = useState([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [newCategory, setNewCategory] = useState({ name: '', icon: '💰' })
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')

  const [profileName, setProfileName] = useState('')
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [profileMsg, setProfileMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Alimentación')
  const [activeTab, setActiveTab] = useState('perfil')
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false)
  const emojiPanelRef = useRef(null)

  useEffect(() => {
    fetchHouseholds()
    setProfileName(user?.name || '')
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(event.target)) {
        setShowEmojiSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchHouseholds = async () => {
    try {
      const res = await api.get('/households')
      setHouseholds(res.data)
    } catch (error) {
      console.error('Error fetching households:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const createCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return
    try {
      await api.post('/categories', newCategory)
      setNewCategory({ name: '', icon: '💰' })
      fetchCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error al crear la categoría')
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditIcon(cat.icon)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditIcon('')
  }

  const saveEdit = async (id) => {
    try {
      await api.put(`/categories/${id}`, { name: editName, icon: editIcon })
      setEditingId(null)
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      alert(error.response?.data?.detail || 'Error al actualizar')
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    try {
      await api.delete(`/categories/${id}`)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert(error.response?.data?.detail || 'Error al eliminar')
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setProfileMsg('')
    try {
      await api.put('/auth/profile', null, { params: { name: profileName } })
      setProfileMsg('Perfil actualizado correctamente')
    } catch (error) {
      console.error('Error updating profile:', error)
      setProfileMsg('Error al actualizar el perfil')
    }
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg('')
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMsg('Las contraseñas no coinciden')
      return
    }
    if (!passwordData.current_password || !passwordData.new_password) {
      setPasswordMsg('Completa todos los campos')
      return
    }
    try {
      await api.put('/auth/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })
      setPasswordMsg('Contraseña actualizada correctamente')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      setPasswordMsg(error.response?.data?.detail || 'Error al actualizar la contraseña')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="card">
            <div className="flex items-center justify-center mb-6">
              <UserCircleIcon className="h-6 w-6 text-dark-400 mr-3" />
              <h2 className="text-lg font-medium text-dark-100">Perfil</h2>
            </div>
            <form onSubmit={updateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input-field bg-dark-800 cursor-not-allowed opacity-60"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                  Nombre
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input-field"
                  placeholder="Tu nombre"
                  maxLength={50}
                />
              </div>
              <div className="flex flex-col items-center space-y-3">
                <button type="submit" className="btn-primary w-full max-w-xs">
                  Guardar cambios
                </button>
                {profileMsg && (
                  <span className="text-sm text-green-400">{profileMsg}</span>
                )}
              </div>
            </form>

            <div className="border-t border-dark-700 my-6"></div>

            <div className="flex items-center justify-center mb-6">
              <KeyIcon className="h-6 w-6 text-dark-400 mr-3" />
              <h2 className="text-lg font-medium text-dark-100">Cambiar contraseña</h2>
            </div>
            <form onSubmit={updatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, current_password: e.target.value })
                  }
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col items-center space-y-3">
                <button type="submit" className="btn-primary w-full max-w-xs">
                  Actualizar contraseña
                </button>
                {passwordMsg && (
                  <span
                    className={`text-sm ${
                      passwordMsg.includes('correctamente')
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {passwordMsg}
                  </span>
                )}
              </div>
            </form>
          </div>
        )
      case 'categorias':
        return (
          <div className="card">
            <div className="flex items-center justify-center mb-6">
              <TagIcon className="h-6 w-6 text-dark-400 mr-3" />
              <h2 className="text-lg font-medium text-dark-100">Mis categorías</h2>
            </div>

            <div className="text-sm text-dark-400 mb-4 text-center">
              Las categorías por defecto son compartidas. Las que crees solo tú serán visibles para ti.
            </div>

            <form onSubmit={createCategory} className="mb-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, name: e.target.value })
                        }
                        className="input-field"
                        placeholder="Nueva categoría"
                        maxLength={30}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                        Icono
                      </label>
                      <input
                        type="text"
                        value={newCategory.icon}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, icon: e.target.value })
                        }
                        onFocus={() => setShowEmojiSuggestions(true)}
                        className="input-field text-center text-lg"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  {showEmojiSuggestions && (
                    <div ref={emojiPanelRef} className="mb-4 animate-fade-in">
                      <label className="block text-sm font-medium text-dark-300 mb-2 text-center">
                        Sugerencia de icono
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedEmojiCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              selectedEmojiCategory === cat
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewCategory({ ...newCategory, icon: emoji })
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl transition ${
                              newCategory.icon === emoji
                                ? 'bg-primary-500/20 ring-2 ring-primary-500'
                                : 'bg-dark-700 hover:bg-dark-600'
                            }`}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button type="submit" className="btn-primary w-full max-w-xs inline-flex items-center justify-center h-11">
                      <PlusIcon className="h-5 w-5 mr-1" />
                      Añadir
                    </button>
                  </div>
                </form>

                {categories.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    No tienes categorías personalizadas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-dark-700/50"
                      >
                        {editingId === cat.id ? (
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="text"
                              value={editIcon}
                              onChange={(e) => setEditIcon(e.target.value)}
                              className="input-field w-14 text-center text-lg"
                              maxLength={4}
                            />
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input-field flex-1"
                              maxLength={30}
                            />
                            <button
                              type="button"
                              onClick={() => saveEdit(cat.id)}
                              className="text-green-400 hover:text-green-300 transition"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-dark-400 hover:text-dark-200 transition"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{cat.icon}</span>
                              <span className="font-medium text-dark-100">{cat.name}</span>
                              {cat.is_default && (
                                <span className="hidden lg:inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <LockClosedIcon className="h-3 w-3 mr-1" />
                                  Por defecto
                                </span>
                              )}
                              {cat.is_default && (
                                <LockClosedIcon className="lg:hidden h-4 w-4 text-blue-400" title="Por defecto" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => startEdit(cat)}
                                disabled={cat.is_default}
                                className={`p-2 rounded-lg transition ${
                                  cat.is_default
                                    ? 'text-dark-600 cursor-not-allowed'
                                    : 'text-dark-400 hover:text-primary-400 hover:bg-dark-700'
                                }`}
                                title={cat.is_default ? 'No editable' : 'Editar'}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCategory(cat.id)}
                                disabled={cat.is_default}
                                className={`p-2 rounded-lg transition ${
                                  cat.is_default
                                    ? 'text-dark-600 cursor-not-allowed'
                                    : 'text-dark-400 hover:text-red-400 hover:bg-dark-700'
                                }`}
                                title={cat.is_default ? 'No eliminable' : 'Eliminar'}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
        )
      default:
        return null
    }
  }

  const currentTab = TABS.find(t => t.id === activeTab)

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading">Configuración</h1>
        <p className="subheading mt-1">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden mb-4 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <div className="card p-2 sticky top-4">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition ${
                      activeTab === tab.id
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="lg:hidden">
            <div className="flex items-center space-x-2 mb-4">
              {currentTab && (
                <>
                  <currentTab.icon className="h-5 w-5 text-dark-400" />
                  <h2 className="text-lg font-medium text-dark-100">{currentTab.label}</h2>
                </>
              )}
            </div>
          </div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}