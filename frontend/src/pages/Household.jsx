import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import HouseholdCard from '../components/HouseholdCard'
import CreateHouseholdModal from '../components/CreateHouseholdModal'
import InviteMemberModal from '../components/InviteMemberModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { PlusIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function Household() {
  const { user } = useAuth()
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState(null)

  useEffect(() => {
    fetchHouseholds()
  }, [])

  const fetchHouseholds = async () => {
    try {
      const response = await api.get('/households')
      setHouseholds(response.data)
    } catch (error) {
      console.error('Error fetching households:', error)
    } finally {
      setLoading(false)
    }
  }

  const createHousehold = async (data) => {
    const response = await api.post('/households', data)
    setHouseholds([...households, response.data])
    return response.data
  }

  const deleteHousehold = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return

    try {
      await api.delete(`/households/${id}`)
      setHouseholds(households.filter((h) => h.id !== id))
    } catch (error) {
      console.error('Error deleting household:', error)
      alert('Error al eliminar el grupo')
    }
  }

  const inviteMember = async (householdId, email) => {
    const response = await api.post(`/households/${householdId}/invite`, { email })
    await fetchHouseholds()
    return response.data
  }

  const handleInvite = (household) => {
    setSelectedHousehold(household)
    setShowInviteModal(true)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading">Grupos</h1>
          <p className="subheading mt-1">
            Gestiona tus grupos y miembros
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Grupo
        </button>
      </div>

      {households.length === 0 ? (
        <div className="card text-center py-12">
          <HomeIcon className="h-16 w-16 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-100 mb-2">
            No tienes grupos
          </h3>
          <p className="text-dark-400 mb-6">
            Crea tu primer grupo para empezar a compartir gastos
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((household) => (
            <HouseholdCard
              key={household.id}
              household={household}
              currentUserId={user?.id}
              onInvite={handleInvite}
              onDelete={deleteHousehold}
            />
          ))}
        </div>
      )}

      <CreateHouseholdModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createHousehold}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          setSelectedHousehold(null)
        }}
        onSubmit={inviteMember}
        household={selectedHousehold}
      />
    </div>
  )
}