import { useState } from 'react'

export function useFormModal(initialData) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingShared, setEditingShared] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState(initialData)

  const openForNew = () => {
    setEditingId(null)
    setEditingShared(false)
    setFormError('')
    setFormData(initialData)
    setShowModal(true)
  }

  const openForEdit = (id, data, isShared = false) => {
    setEditingId(id)
    setEditingShared(isShared)
    setFormError('')
    setFormData(data)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormError('')
  }

  return {
    showModal,
    editingId,
    editingShared,
    formData,
    setFormData,
    formError,
    setFormError,
    openForNew,
    openForEdit,
    closeModal,
  }
}
