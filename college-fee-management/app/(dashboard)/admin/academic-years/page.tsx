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
  const [formData, setFormData] = useState({ year: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isCurrent: false })
  const { showToast } = useToast()

  useEffect(() => { fetchYears() }, [])

  const fetchYears = async () => {
    const res = await fetch('/api/academic-years')
    setYears(await res.json())
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingYear ? `/api/academic-years?id=${editingYear.id}` : '/api/academic-years'
    const method = editingYear ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
    if (res.ok) {
      showToast(`Academic year ${editingYear ? 'updated' : 'added'}`, 'success')
      setShowModal(false)
      resetForm()
      fetchYears()
    } else showToast('Failed to save', 'error')
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/academic-years?id=${deleteConfirm.id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Deleted', 'success'); fetchYears() }
    else showToast('Failed', 'error')
    setDeleteConfirm({ isOpen: false, id: '' })
  }

  const resetForm = () => { setFormData({ year: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isCurrent: false }); setEditingYear(null) }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">Academic Years</h1><button onClick={() => setShowModal(true)} className="btn-primary">Add Year</button></div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3">Year</th><th>Start</th><th>End</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>{years.map(y => (<tr key={y.id}><td className="px-6 py-4">{y.year}</td><td>{y.startYear}</td><td>{y.endYear}</td><td>{y.isCurrent ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Current</span> : '-'}</td><td className="text-right"><button onClick={() => { setEditingYear(y); setFormData(y); setShowModal(true) }} className="text-blue-600 mr-3">Edit</button><button onClick={() => setDeleteConfirm({ isOpen: true, id: y.id })} className="text-red-600">Delete</button></td></tr>))}</tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{editingYear ? 'Edit' : 'Add'} Academic Year</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Year (e.g., 2025-26)</label><input type="text" required value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="input-field" /></div>
              <div><label>Start Year</label><input type="number" required value={formData.startYear} onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value), year: `${e.target.value}-${(parseInt(e.target.value)+1).toString().slice(-2)}` })} className="input-field" /></div>
              <div><label>End Year</label><input type="number" required value={formData.endYear} onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) })} className="input-field" /></div>
              <div><label className="flex items-center"><input type="checkbox" checked={formData.isCurrent} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="mr-2" /> Set as Current Academic Year</label></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={deleteConfirm.isOpen} title="Delete Year" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ isOpen: false, id: '' })} />
    </div>
  )
}