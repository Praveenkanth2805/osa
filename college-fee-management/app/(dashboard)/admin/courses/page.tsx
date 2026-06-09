'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Course, Department } from '@/types'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [formData, setFormData] = useState({ name: '', code: '', fee: '', departmentId: '' })
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/departments'),
      ])
      setCourses(await coursesRes.json())
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
      const url = editingCourse ? `/api/courses?id=${editingCourse.id}` : '/api/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      const res = await fetch(url, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...formData, fee: parseFloat(formData.fee) }),
})

const data = await res.json()

if (!res.ok) {
  throw new Error(data.error || 'Failed to save course')
}
      showToast(`Course ${editingCourse ? 'updated' : 'added'} successfully`, 'success')
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error: any) {
  showToast(error.message, 'error')
}
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/courses?id=${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Course deleted', 'success')
      setDeleteConfirm({ isOpen: false, id: '' })
      fetchData()
    } catch (error) {
      showToast('Failed to delete course', 'error')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', code: '', fee: '', departmentId: '' })
    setEditingCourse(null)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Add Course
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee (₹)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.department?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{course.fee.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => {
                      setEditingCourse(course)
                      setFormData({
                        name: course.name,
                        code: course.code,
                        fee: course.fee.toString(),
                        departmentId: course.departmentId,
                      })
                      setShowModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: course.id })}
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
              {editingCourse ? 'Edit Course' : 'Add Course'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
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
                  {editingCourse ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Course"
        message="This will also remove this course from students. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })}
      />
    </div>
  )
}