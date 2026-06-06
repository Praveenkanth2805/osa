'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Student, AcademicYear, Payment, Department } from '@/types'
import { EyeIcon, CreditCardIcon } from '@heroicons/react/24/outline'

interface BillListProps {
  role: 'ADMIN' | 'DEPARTMENT'
}

export default function BillList({ role }: BillListProps) {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedYearId, setSelectedYearId] = useState('')
  const [payments, setPayments] = useState<Record<string, Payment>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [filters, setFilters] = useState({
    registerNo: '',
    studentName: '',
    departmentId: '',
    receiptNumber: '',
  })
  const { showToast } = useToast()

  const isAdmin = role === 'ADMIN'

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedYearId) {
      fetchPayments()
    }
  }, [selectedYearId])

  useEffect(() => {
    applyFilters()
  }, [students, filters, payments])

  const fetchData = async () => {
    try {
      const [studentsRes, yearsRes, deptsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/academic-years'),
        isAdmin ? fetch('/api/departments') : Promise.resolve({ json: () => [] }),
      ])
      const studentsData = await studentsRes.json()
      const yearsData = await yearsRes.json()
      
      setStudents(studentsData.filter((s: Student) => !s.isArchived))
      setAcademicYears(yearsData)
      if (isAdmin) {
        setDepartments(await deptsRes.json())
      }
      
      const currentYear = yearsData.find((y: AcademicYear) => y.isCurrent)
      if (currentYear) {
        setSelectedYearId(currentYear.id)
      } else if (yearsData.length > 0) {
        setSelectedYearId(yearsData[0].id)
      }
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments?academicYearId=${selectedYearId}`)
      const paymentsData = await res.json()
      const paymentMap: Record<string, Payment> = {}
      paymentsData.forEach((p: Payment) => {
        paymentMap[p.studentId] = p
      })
      setPayments(paymentMap)
    } catch (error) {
      showToast('Failed to load payment status', 'error')
    }
  }

  const applyFilters = () => {
    let filtered = [...students]
    
    if (filters.registerNo) {
      filtered = filtered.filter(s => 
        s.registerNumber.toLowerCase().includes(filters.registerNo.toLowerCase())
      )
    }
    if (filters.studentName) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(filters.studentName.toLowerCase())
      )
    }
    if (isAdmin && filters.departmentId) {
      filtered = filtered.filter(s => s.departmentId === filters.departmentId)
    }
    if (filters.receiptNumber) {
      filtered = filtered.filter(s => {
        const payment = payments[s.id]
        return payment && payment.receiptNumber.toLowerCase().includes(filters.receiptNumber.toLowerCase())
      })
    }
    
    setFilteredStudents(filtered)
  }

  const handleViewReceipt = (paymentId: string) => {
    window.open(`/receipt/${paymentId}`, '_blank')
  }

  const handlePayClick = (student: Student) => {
    setSelectedStudent(student)
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          academicYearId: selectedYearId,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Payment failed')
      }
      const payment = await res.json()
      showToast('Payment successful!', 'success')
      setShowPaymentModal(false)
      // Refresh payment status
      fetchPayments()
      // Open receipt in new tab
      window.open(`/receipt/${payment.id}`, '_blank')
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      registerNo: '',
      studentName: '',
      departmentId: '',
      receiptNumber: '',
    })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Bill / Payment Status</h1>
        <div className="w-64">
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="input-field"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year} {year.isCurrent && '(Current)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Register Number"
            value={filters.registerNo}
            onChange={(e) => setFilters({ ...filters, registerNo: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Student Name"
            value={filters.studentName}
            onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
            className="input-field"
          />
          {isAdmin && (
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              className="input-field"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Receipt Number (if paid)"
            value={filters.receiptNumber}
            onChange={(e) => setFilters({ ...filters, receiptNumber: e.target.value })}
            className="input-field"
          />
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => {
              const payment = payments[student.id]
              const isPaid = !!payment
              return (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.registerNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.department?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.course?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{student.course?.fee?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isPaid ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Paid</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Unpaid</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isPaid ? (
                      <button
                        onClick={() => handleViewReceipt(payment.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Receipt"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePayClick(student)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                      >
                        <CreditCardIcon className="w-4 h-4" />
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No students match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Make Payment</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Student:</strong> {selectedStudent.name}</p>
                <p><strong>Register No:</strong> {selectedStudent.registerNumber}</p>
                <p><strong>Course:</strong> {selectedStudent.course?.name}</p>
                <p><strong>Fee Amount:</strong> ₹{selectedStudent.course?.fee}</p>
                <p><strong>Academic Year:</strong> {academicYears.find(y => y.id === selectedYearId)?.year}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}