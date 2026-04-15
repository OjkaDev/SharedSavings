import { Link } from 'react-router-dom'
import { TrashIcon, UserPlusIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function HouseholdCard({ household, onInvite, onDelete, currentUserId }) {
  const isOwner = household.created_by === currentUserId

  return (
    <div className="card card-hover">
      <div className="flex justify-between items-start">
        <Link to={`/household/${household.id}`} className="flex items-center flex-1">
          <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mr-4 border border-primary-500/30">
            <UserGroupIcon className="h-6 w-6 text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-dark-100 hover:text-primary-400 transition">
              {household.name}
            </h3>
            <p className="text-sm text-dark-400">
              {household.members?.length || 0} miembro{household.members?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-dark-500" />
        </Link>
        {isOwner && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onDelete(household.id)
            }}
            className="text-dark-500 hover:text-red-400 transition ml-2"
            title="Eliminar vivienda"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-4 border-t border-dark-700 pt-4">
        <p className="text-sm font-medium text-dark-300 mb-3">Miembros:</p>
        <div className="space-y-2">
          {household.members?.map((member) => (
            <div key={member.id} className="flex items-center text-sm">
              <span className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center text-dark-200 font-medium mr-3">
                {member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="text-dark-200">{member.name || member.email}</span>
              {member.id === household.created_by && (
                <span className="ml-2 px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-lg border border-primary-500/30">
                  Propietario
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-700">
        <button
          onClick={() => onInvite(household)}
          className="btn-secondary w-full inline-flex items-center justify-center"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Invitar Miembro
        </button>
      </div>
    </div>
  )
}