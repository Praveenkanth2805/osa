'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Student, Department, Course, AcademicYear } from '@/types'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
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
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, deptsRes, coursesRes, yearsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/departments'),
        fetch('/api/courses'),
        fetch('/api/academic-years'),
      ])
      if (!studentsRes.ok || !deptsRes.ok || !coursesRes.ok || !yearsRes.ok) throw new Error()
      setStudents(await studentsRes.json())
      setDepartments(await deptsRes.json())
      setCourses(await coursesRes.json())
      setAcademicYears(await yearsRes.json())
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

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
      fetchData()
    } catch (error: any) {
      showToast(error.message, 'error')
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/students?id=${deleteConfirm.studentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete student')
      showToast('Student deleted successfully', 'success')
      setDeleteConfirm({ isOpen: false, studentId: '' })
      fetchData()
    } catch (error) {
      showToast('Failed to delete student', 'error')
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

  if (loading) return <LoadingSpinner />

  // Get current academic year for default selection
  const currentYear = academicYears.find(y => y.isCurrent)

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

      <div className="overflow-x-auto">
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
                  <button onClick={() => setDeleteConfirm({ isOpen: true, studentId: student.id })} className="text-red-600 hover:text-red-800">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Modal with Academic Year Dropdown */}
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

      <ConfirmDialog isOpen={deleteConfirm.isOpen} title="Delete Student" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ isOpen: false, studentId: '' })} />
    </div>
  )
}