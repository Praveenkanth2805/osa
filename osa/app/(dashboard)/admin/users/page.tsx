'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { User, Department } from '@/types'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function DepartmentUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    departmentId: '',
  })
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments'),
      ])
      setUsers(await usersRes.json())
      setDepartments(await deptsRes.json())
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingUser ? `/api/users?id=${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

if (!res.ok) {
  throw new Error(data.error || 'Failed to save user')
}

showToast(
  `User ${editingUser ? 'updated' : 'created'} successfully`,
  'success'
)

      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error: any) {
  showToast(error.message, 'error')
}
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/users?id=${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('User deleted', 'success')
      setDeleteConfirm({ isOpen: false, id: '' })
      fetchData()
    } catch (error) {
      showToast('Failed to delete user', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', departmentId: '' })
    setEditingUser(null)
  }

  const editUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // password field left empty – user can optionally change it
      name: user.name,
      departmentId: user.departmentId || '',
    })
    setShowModal(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Department Users</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Add Department User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.departmentName || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => editUser(user)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="w-5 h-5 inline" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: user.id })}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit Department User' : 'Add Department User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password {editingUser && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder={editingUser ? 'New password (optional)' : 'Password *'}
                  {...(!editingUser && { required: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department *</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
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
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete User"
        message="Are you sure you want to delete this department user?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })}
      />
    </div>
  )
}