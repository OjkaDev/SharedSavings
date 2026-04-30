import { XMarkIcon } from '@heroicons/react/24/outline'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className={`card ${maxWidth} w-full mx-4`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-dark-100">{title}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200 transition">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
