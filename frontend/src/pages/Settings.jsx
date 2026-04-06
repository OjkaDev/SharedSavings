import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchHouseholds()
    setProfileName(user?.name || '')
  }, [])

  useEffect(() => {
    if (selectedHouseholdId) {
      fetchCategories()
    }
  }, [selectedHouseholdId])

  const fetchHouseholds = async () => {
    try {
      const res = await api.get('/households')
      setHouseholds(res.data)
      if (res.data.length > 0) {
        setSelectedHouseholdId(res.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching households:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', {
        params: { household_id: selectedHouseholdId },
      })
      setCategories(res.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const createCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim() || !selectedHouseholdId) return
    try {
      await api.post('/categories', newCategory, {
        params: { household_id: selectedHouseholdId },
      })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona categorías, perfil y contraseña
        </p>
      </div>

      {/* Sección: Perfil */}
      <div className="card">
        <div className="flex items-center mb-4">
          <UserCircleIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Perfil</h2>
        </div>
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="input-field bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <div className="flex items-center space-x-3">
            <button type="submit" className="btn-primary">
              Guardar cambios
            </button>
            {profileMsg && (
              <span className="text-sm text-green-600">{profileMsg}</span>
            )}
          </div>
        </form>
      </div>

      {/* Sección: Cambiar contraseña */}
      <div className="card">
        <div className="flex items-center mb-4">
          <KeyIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Cambiar contraseña</h2>
        </div>
        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <div className="flex items-center space-x-3">
            <button type="submit" className="btn-primary">
              Actualizar contraseña
            </button>
            {passwordMsg && (
              <span
                className={`text-sm ${
                  passwordMsg.includes('correctamente')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {passwordMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Sección: Gestión de categorías */}
      <div className="card">
        <div className="flex items-center mb-4">
          <TagIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Gestión de categorías</h2>
        </div>

        {households.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Crea una vivienda primero para poder gestionar categorías.
          </div>
        ) : (
          <>
            {/* Selector de vivienda */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vivienda
              </label>
              <select
                value={selectedHouseholdId}
                onChange={(e) => setSelectedHouseholdId(e.target.value)}
                className="input-field"
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Formulario crear categoría */}
            <form onSubmit={createCategory} className="mb-6">
              <div className="flex items-end space-x-3 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono
                  </label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, icon: e.target.value })
                    }
                    className="input-field text-center"
                    maxLength={4}
                  />
                </div>
                <button type="submit" className="btn-primary inline-flex items-center h-10">
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Añadir
                </button>
              </div>

              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar icono
                </label>
                <div className="flex space-x-2 mb-2">
                  {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedEmojiCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        selectedEmojiCategory === cat
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setNewCategory({ ...newCategory, icon: emoji })
                      }
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl hover:bg-gray-100 transition ${
                        newCategory.icon === emoji
                          ? 'bg-primary-100 ring-2 ring-primary-500'
                          : ''
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Lista de categorías */}
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay categorías para esta vivienda.
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    {editingId === cat.id ? (
                      <div className="flex items-center space-x-3 flex-1">
                        <input
                          type="text"
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="input-field w-16 text-center"
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
                          className="text-green-500 hover:text-green-600"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-medium text-gray-900">{cat.name}</span>
                          {cat.is_default && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <LockClosedIcon className="h-3 w-3 mr-1" />
                              Por defecto
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            disabled={cat.is_default}
                            className={`transition ${
                              cat.is_default
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-primary-500'
                            }`}
                            title={cat.is_default ? 'No editable' : 'Editar'}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(cat.id)}
                            disabled={cat.is_default}
                            className={`transition ${
                              cat.is_default
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-500'
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
          </>
        )}
      </div>
    </div>
  )
}
