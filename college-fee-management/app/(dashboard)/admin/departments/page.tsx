'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Department } from '@/types'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [formData, setFormData] = useState({ name: '', code: '', description: '' })
  const { showToast } = useToast()

  useEffect(() => { fetchDepartments() }, [])

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      setDepartments(await res.json())
    } catch (error) {
      showToast('Failed to load departments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingDept ? `/api/departments?id=${editingDept.id}` : '/api/departments'
      const method = editingDept ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error()
      showToast(`Department ${editingDept ? 'updated' : 'added'} successfully`, 'success')
      setShowModal(false)
      resetForm()
      fetchDepartments()
    } catch (error) {
      showToast('Failed to save department', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/departments?id=${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Department deleted', 'success')
      setDeleteConfirm({ isOpen: false, id: '' })
      fetchDepartments()
    } catch (error) {
      showToast('Failed to delete department', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' })
    setEditingDept(null)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dept.code}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{dept.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => {
                      setEditingDept(dept)
                      setFormData({ name: dept.name, code: dept.code, description: dept.description || '' })
                      setShowModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: dept.id })}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingDept ? 'Edit Department' : 'Add Department'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDept ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Department"
        message="This will also delete all courses and students under this department. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })}
      />
    </div>
  )
}