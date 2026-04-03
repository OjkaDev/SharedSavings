import { TrashIcon, UserPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function HouseholdCard({ household, onInvite, onDelete, currentUserId }) {
  const isOwner = household.created_by === currentUserId

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
            <UserGroupIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{household.name}</h3>
            <p className="text-sm text-gray-500">
              {household.members?.length || 0} miembro{household.members?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(household.id)}
            className="text-gray-400 hover:text-red-500 transition"
            title="Eliminar vivienda"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Miembros:</p>
        <div className="space-y-2">
          {household.members?.map((member) => (
            <div key={member.id} className="flex items-center text-sm">
              <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium mr-2">
                {member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="text-gray-700">{member.name || member.email}</span>
              {member.id === household.created_by && (
                <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Propietario
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
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
