'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Student, Course, AcademicYear } from '@/types'
import Link from 'next/link'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function DepartmentStudentsPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
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
    courseId: '',
    academicYearId: '',
  })
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes, yearsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/courses'),
        fetch('/api/academic-years'),
      ])
      setStudents(await studentsRes.json())
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
      // Department ID is taken from the session, not from form
      const payload = {
        ...formData,
        departmentId: session?.user?.departmentId,
      }
      const url = editingStudent ? `/api/students?id=${editingStudent.id}` : '/api/students'
      const method = editingStudent ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete student')
    }

    showToast('Student deleted successfully', 'success')
    setDeleteConfirm({ isOpen: false, studentId: '' })
    fetchData()
  } catch (error: any) {
    showToast(error.message, 'error')
  }
}

  const resetForm = () => {
    setFormData({
      registerNumber: '',
      name: '',
      gender: 'MALE',
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
      courseId: student.courseId,
      academicYearId: student.academicYearId || '',
    })
    setShowModal(true)
  }

  // Filter courses that belong to this department only
  const departmentCourses = courses.filter(c => c.departmentId === session?.user?.departmentId)

  if (loading) return <LoadingSpinner />

  return (
        
    <div>
      
      <div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold">Students - {session?.user?.departmentName}</h1>
  {/* <div className="flex gap-3">
    <Link href="/department/students/import" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
      Import Excel
    </Link>
    <button onClick={() => setShowModal(true)} className="btn-primary">
      Add Student
    </button>
  </div> */}
</div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Register No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Academic Year</th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 text-sm font-medium">{student.registerNumber}</td>
                <td className="px-6 py-4 text-sm">{student.name}</td>
                <td className="px-6 py-4 text-sm">{student.course?.name}</td>
                <td className="px-6 py-4 text-sm">{student.academicYear?.year || '-'}</td>
                {/* <td className="px-6 py-4">
                  {student.isArchived ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Archived</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  )}
                </td> */}
                {/* <td className="px-6 py-4">
                  <button onClick={() => editStudent(student)} className="text-blue-600 mr-3">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setDeleteConfirm({ isOpen: true, studentId: student.id })} className="text-red-600">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal - no department field */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Register Number *</label>
                <input type="text" required value={formData.registerNumber} onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium">Gender *</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="input-field">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Department</label>
                <input type="text" disabled value={session?.user?.departmentName || 'Your Department'} className="input-field bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium">Course *</label>
                <select required value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value })} className="input-field">
                  <option value="">Select Course</option>
                  {departmentCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.name} - ₹{course.fee}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Academic Year *</label>
                <select required value={formData.academicYearId} onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })} className="input-field">
                  <option value="">Select Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.year} {year.isCurrent && '(Current)'}</option>
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