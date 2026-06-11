'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Student, Department, Course, AcademicYear } from '@/types'
import { PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce' 

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showPaymentWarning, setShowPaymentWarning] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; studentId: string }>({
    isOpen: false,
    studentId: '',
  })
  const [formData, setFormData] = useState({
    registerNumber: '',
    name: '',
    gender: 'MALE',
    mobile: '',
    departmentId: '',
    courseId: '',
    academicYearId: '',
  })

  // Filter states
  const [filters, setFilters] = useState({
    registerNumber: '',
    name: '',
    departmentId: '',
    courseId: '',
    academicYearId: '',
    status: 'active', // 'active', 'archived', 'all'
  })

  const { showToast } = useToast()

  // Debounce text filters
  const debouncedRegisterNumber = useDebounce(filters.registerNumber, 500)
  const debouncedName = useDebounce(filters.name, 500)

  // Fetch data whenever filters change
  useEffect(() => {
    fetchFilteredStudents()
  }, [debouncedRegisterNumber, debouncedName, filters.departmentId, filters.courseId, filters.academicYearId, filters.status])

  const fetchFilteredStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedRegisterNumber) params.append('registerNumber', debouncedRegisterNumber)
      if (debouncedName) params.append('name', debouncedName)
      if (filters.departmentId) params.append('departmentId', filters.departmentId)
      if (filters.courseId) params.append('courseId', filters.courseId)
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId)
      if (filters.status === 'active') params.append('isArchived', 'false')
      else if (filters.status === 'archived') params.append('isArchived', 'true')
      // 'all' sends no isArchived param

      const res = await fetch(`/api/students?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStudents(data)
    } catch (error) {
      showToast('Failed to load students', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [deptsRes, coursesRes, yearsRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/courses'),
        fetch('/api/academic-years'),
      ])
      setDepartments(await deptsRes.json())
      setCourses(await coursesRes.json())
      setAcademicYears(await yearsRes.json())
    } catch (error) {
      showToast('Failed to load filter data', 'error')
    }
  }

  useEffect(() => {
    fetchData()
    fetchFilteredStudents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStudent ? `/api/students?id=${editingStudent.id}` : '/api/students'
      const method = editingStudent ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save student')
      }
      
      showToast(`Student ${editingStudent ? 'updated' : 'added'} successfully`, 'success')
      setShowModal(false)
      resetForm()
      fetchFilteredStudents() // refresh list
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleDeleteClick = async (studentId: string) => {
  // Check if student has payments
  try {
    const checkRes = await fetch(`/api/students/${studentId}/has-payments`)
    const { hasPayments } = await checkRes.json()
    
    if (hasPayments) {
      setPendingDeleteId(studentId)
      setShowPaymentWarning(true)
    } else {
      // No payments, proceed directly
      setDeleteConfirm({ isOpen: true, studentId })
    }
  } catch (error) {
    showToast('Failed to check payment status', 'error')
  }
}

const confirmDeleteWithPayment = async () => {
  if (!pendingDeleteId) return
  setShowPaymentWarning(false)
  // Now proceed with deletion
  await performDelete(pendingDeleteId)
  setPendingDeleteId(null)
}

const performDelete = async (studentId: string) => {
  try {
    const res = await fetch(`/api/students?id=${studentId}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete student')
    }
    showToast('Student deleted successfully', 'success')
    setDeleteConfirm({ isOpen: false, studentId: '' })
    fetchFilteredStudents() // refresh the list
  } catch (error: any) {
    showToast(error.message, 'error')
  }
}

  const resetForm = () => {
    setFormData({
      registerNumber: '',
      name: '',
      gender: 'MALE',
      mobile: '',
      departmentId: '',
      courseId: '',
      academicYearId: '',
    })
    setEditingStudent(null)
  }

  const editStudent = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      registerNumber: student.registerNumber,
      name: student.name,
      gender: student.gender,
      mobile: student.mobile,
      departmentId: student.departmentId,
      courseId: student.courseId,
      academicYearId: student.academicYearId || '',
    })
    setShowModal(true)
  }

  // Reset filters
  const clearFilters = () => {
    setFilters({
      registerNumber: '',
      name: '',
      departmentId: '',
      courseId: '',
      academicYearId: '',
      status: 'active',
    })
  }

  // Filter courses based on selected department (for dropdown)
  const filteredCourses = useMemo(() => {
    if (!filters.departmentId) return courses
    return courses.filter(c => c.departmentId === filters.departmentId)
  }, [courses, filters.departmentId])

  if (loading && students.length === 0) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <div className="flex gap-3">
          <Link href="/admin/students/import" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Import Excel
          </Link>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Student
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Register No</label>
            <input
              type="text"
              value={filters.registerNumber}
              onChange={(e) => setFilters({ ...filters, registerNumber: e.target.value })}
              placeholder="Search by register no"
              className="input-field py-1 px-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Student Name</label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              placeholder="Search by name"
              className="input-field py-1 px-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value, courseId: '' })}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="input-field py-1 px-2 text-sm"
              disabled={!filters.departmentId}
            >
              <option value="">All Courses</option>
              {filteredCourses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={filters.academicYearId}
              onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value })}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field py-1 px-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-800">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-auto max-h-[70vh] border rounded-lg">
        <table className="w-full max-w-5xl mx-auto divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.registerNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.department?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.course?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.academicYear?.year || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.mobile}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {student.isArchived ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Archived</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <button onClick={() => editStudent(student)} className="text-blue-600 hover:text-blue-800 mr-3">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
  onClick={() => handleDeleteClick(student.id)}
  className="text-red-600 hover:text-red-800"
>
  <TrashIcon className="w-5 h-5" />
</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Student Modal (unchanged) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Register Number *</label>
                <input type="text" required value={formData.registerNumber} onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })} className="input-field">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile *</label>
                <input type="tel" required pattern="[0-9]{10}" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department *</label>
                <select required value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, courseId: '' })} className="input-field">
                  <option value="">Select Department</option>
                  {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course *</label>
                <select required value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="input-field">
                  <option value="">Select Course</option>
                  {courses.filter(c => c.departmentId === formData.departmentId).map((course) => (<option key={course.id} value={course.id}>{course.name} - ₹{course.fee}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                <select required value={formData.academicYearId} onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })} className="input-field">
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year} {year.isCurrent && '(Current)'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingStudent ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentWarning && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold text-red-600 mb-2">⚠️ Payment Record Exists</h3>
      <p className="text-gray-700 mb-4">
        This student has made a payment. Deleting the student will also permanently delete the associated payment record.
        This action cannot be undone.
      </p>
      <p className="text-gray-600 mb-6">Are you absolutely sure you want to delete this student?</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowPaymentWarning(false)
            setPendingDeleteId(null)
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button onClick={confirmDeleteWithPayment} className="btn-danger">
          Yes, Delete Student & Payment
        </button>
      </div>
    </div>
  </div>
)}

<ConfirmDialog
  isOpen={deleteConfirm.isOpen && !showPaymentWarning}
  title="Delete Student"
  message="Are you sure you want to delete this student? This action cannot be undone."
  onConfirm={() => performDelete(deleteConfirm.studentId)}
  onCancel={() => setDeleteConfirm({ isOpen: false, studentId: '' })}
/>
    </div>
  )
}