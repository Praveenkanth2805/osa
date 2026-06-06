'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Student, AcademicYear } from '@/types'

export default function NewPaymentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({ studentId: '', academicYearId: '' })
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, yearsRes] = await Promise.all([fetch('/api/students'), fetch('/api/academic-years')])
      const allStudents = await studentsRes.json()
      setStudents(allStudents.filter((s: Student) => !s.isArchived))
      setAcademicYears(await yearsRes.json())
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally { setLoading(false) }
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    setSelectedStudent(student || null)
    setFormData({ ...formData, studentId })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Failed to process payment') }
      const payment = await res.json()
      showToast('Payment successful!', 'success')
      router.push(`/receipt/${payment.id}`)
    } catch (error: any) { showToast(error.message, 'error') } finally { setSubmitting(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Make Payment</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Student *</label>
          <select required value={formData.studentId} onChange={(e) => handleStudentSelect(e.target.value)} className="input-field">
            <option value="">Select Student</option>
            {students.map(s => (<option key={s.id} value={s.id}>{s.registerNumber} - {s.name} ({s.department?.name})</option>))}
          </select>
        </div>
        {selectedStudent && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Student Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-600">Register No:</span> <span className="font-medium">{selectedStudent.registerNumber}</span></div>
              <div><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedStudent.name}</span></div>
              <div><span className="text-gray-600">Course:</span> <span className="font-medium">{selectedStudent.course?.name}</span></div>
              <div><span className="text-gray-600">Fee:</span> <span className="font-bold text-green-600">₹{selectedStudent.course?.fee}</span></div>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Academic Year *</label>
          <select required value={formData.academicYearId} onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })} className="input-field">
            <option value="">Select Academic Year</option>
            {academicYears.map(y => (<option key={y.id} value={y.id}>{y.year} {y.isCurrent && '(Current)'}</option>))}
          </select>
        </div>
        <button type="submit" disabled={submitting} className="w-full btn-primary disabled:opacity-50">
          {submitting ? 'Processing...' : 'Process Payment'}
        </button>
      </form>
    </div>
  )
}