'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Student, AcademicYear, Department } from '@/types'
import { ArchiveBoxIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function ArchivePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [archiveFilter, setArchiveFilter] = useState({ academicYearId: '', departmentId: '' })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: 'archive' as 'archive' | 'restore' })
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, yearsRes, deptsRes] = await Promise.all([
        fetch('/api/students?isArchived=false'),
        fetch('/api/academic-years'),
        fetch('/api/departments'),
      ])
      setStudents(await studentsRes.json())
      setAcademicYears(await yearsRes.json())
      setDepartments(await deptsRes.json())
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkArchive = async () => {
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          studentIds: selectedStudents,
        }),
      })
      if (!res.ok) throw new Error()
      showToast(`Archived ${selectedStudents.length} students`, 'success')
      setSelectedStudents([])
      fetchData()
    } catch (error) {
      showToast('Failed to archive', 'error')
    }
    setConfirmDialog({ isOpen: false, action: 'archive' })
  }

  const handleArchiveByFilter = async () => {
    try {
      const payload: any = { action: 'archive' }
      if (archiveFilter.academicYearId) payload.academicYearId = archiveFilter.academicYearId
      if (archiveFilter.departmentId) payload.departmentId = archiveFilter.departmentId
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      showToast('Archived students by filter', 'success')
      fetchData()
    } catch (error) {
      showToast('Failed to archive by filter', 'error')
    }
    setConfirmDialog({ isOpen: false, action: 'archive' })
  }

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Archive</h1>

      {/* Filter-based archive */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Archive by Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <select
            value={archiveFilter.academicYearId}
            onChange={(e) => setArchiveFilter({ ...archiveFilter, academicYearId: e.target.value })}
            className="input-field"
          >
            <option value="">All Academic Years</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
          <select
            value={archiveFilter.departmentId}
            onChange={(e) => setArchiveFilter({ ...archiveFilter, departmentId: e.target.value })}
            className="input-field"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setConfirmDialog({ isOpen: true, action: 'archive' })}
          className="btn-primary bg-yellow-600 hover:bg-yellow-700"
        >
          Archive by Filter
        </button>
      </div>

      {/* Bulk archive from list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Active Students</h2>
          {selectedStudents.length > 0 && (
            <button
              onClick={() => setConfirmDialog({ isOpen: true, action: 'archive' })}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              Archive Selected ({selectedStudents.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === students.length && students.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Register No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Course</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleSelectStudent(student.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.registerNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.department?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.course?.name}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No active students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Archive"
        message="Are you sure you want to archive the selected students? They can be restored later."
        onConfirm={archiveFilter.academicYearId || archiveFilter.departmentId ? handleArchiveByFilter : handleBulkArchive}
        onCancel={() => setConfirmDialog({ isOpen: false, action: 'archive' })}
      />
    </div>
  )
}