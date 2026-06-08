'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { AcademicYear } from '@/types'

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' })
  const [formData, setFormData] = useState({
    year: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 3, // default to 3-year span
    isCurrent: false,
  })
  const { showToast } = useToast()

  useEffect(() => { fetchYears() }, [])

  const fetchYears = async () => {
    const res = await fetch('/api/academic-years')
    setYears(await res.json())
    setLoading(false)
  }

  // Auto-generate year string from startYear and endYear
  const updateYearString = (start: number, end: number) => {
    return `${start}-${end.toString().slice(-2)}` // e.g., 2023-26
  }

  const handleStartYearChange = (value: string) => {
    const start = parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      startYear: start,
      year: updateYearString(start, prev.endYear),
    }))
  }

  const handleEndYearChange = (value: string) => {
    const end = parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      endYear: end,
      year: updateYearString(prev.startYear, end),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validate that end year is greater than start year
    if (formData.endYear <= formData.startYear) {
      showToast('End year must be greater than start year', 'error')
      return
    }

    const url = editingYear ? `/api/academic-years?id=${editingYear.id}` : '/api/academic-years'
    const method = editingYear ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      showToast(`Academic year ${editingYear ? 'updated' : 'added'}`, 'success')
      setShowModal(false)
      resetForm()
      fetchYears()
    } else {
      showToast('Failed to save', 'error')
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/academic-years?id=${deleteConfirm.id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Deleted', 'success')
      fetchYears()
    } else {
      showToast('Failed', 'error')
    }
    setDeleteConfirm({ isOpen: false, id: '' })
  }

  const resetForm = () => {
    const currentYear = new Date().getFullYear()
    setFormData({
      year: `${currentYear}-${(currentYear + 3).toString().slice(-2)}`,
      startYear: currentYear,
      endYear: currentYear + 3,
      isCurrent: false,
    })
    setEditingYear(null)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Academic Years</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Add Year
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Year</th>
              <th className="px-6 py-3 text-left">Start Year</th>
              <th className="px-6 py-3 text-left">End Year</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.map(y => (
              <tr key={y.id}>
                <td className="px-6 py-4">{y.year}</td>
                <td className="px-6 py-4">{y.startYear}</td>
                <td className="px-6 py-4">{y.endYear}</td>
                <td className="px-6 py-4">
                  {y.isCurrent ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Current</span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setEditingYear(y)
                      setFormData({
                        year: y.year,
                        startYear: y.startYear,
                        endYear: y.endYear,
                        isCurrent: y.isCurrent,
                      })
                      setShowModal(true)
                    }}
                    className="text-blue-600 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, id: y.id })}
                    className="text-red-600"
                  >
                    Delete
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{editingYear ? 'Edit' : 'Add'} Academic Year</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Start Year</label>
                <input
                  type="number"
                  required
                  value={formData.startYear}
                  onChange={(e) => handleStartYearChange(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">End Year</label>
                <input
                  type="number"
                  required
                  value={formData.endYear}
                  onChange={(e) => handleEndYearChange(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Year (auto‑generated)</label>
                <input
                  type="text"
                  value={formData.year}
                  disabled
                  className="input-field bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: StartYear-EndYear (e.g., 2023-2026)
                </p>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                    className="mr-2"
                  />
                  Set as Current Academic Year
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Year"
        message="Are you sure you want to delete this academic year?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })}
      />
    </div>
  )
}