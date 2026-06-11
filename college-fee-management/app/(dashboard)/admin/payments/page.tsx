'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Payment, Student, AcademicYear } from '@/types'
import { EyeIcon,TrashIcon } from '@heroicons/react/24/outline'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { student: Student; academicYear: AcademicYear })[]>([])
  const [filteredPayments, setFilteredPayments] = useState<(Payment & { student: Student; academicYear: AcademicYear })[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ registerNo: '', studentName: '', departmentId: '', academicYearId: '', receiptNumber: '' })
  const [departments, setDepartments] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const { showToast } = useToast()
  const [resetPaymentId, setResetPaymentId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
  try {
    const [paymentsRes, deptsRes, yearsRes] = await Promise.all([
      fetch('/api/payments'),
      fetch('/api/departments'),
      fetch('/api/academic-years'),
    ])
    
    if (!paymentsRes.ok) {
      const errorData = await paymentsRes.json()
      throw new Error(errorData.error || 'Failed to load payments')
    }
    
    const paymentsData = await paymentsRes.json()
    setPayments(paymentsData)
    setFilteredPayments(paymentsData)
    setDepartments(await deptsRes.json())
    setAcademicYears(await yearsRes.json())
  } catch (error) {
    showToast(
    error instanceof Error ? error.message : 'Something went wrong',
    'error'
  )
  } finally {
    setLoading(false)
  }
}

  const applyFilters = () => {
    let filtered = [...payments]
    if (filters.registerNo) filtered = filtered.filter(p => p.student.registerNumber.includes(filters.registerNo))
    if (filters.studentName) filtered = filtered.filter(p => p.student.name.toLowerCase().includes(filters.studentName.toLowerCase()))
    if (filters.departmentId) filtered = filtered.filter(p => p.student.departmentId === filters.departmentId)
    if (filters.academicYearId) filtered = filtered.filter(p => p.academicYearId === filters.academicYearId)
    if (filters.receiptNumber) filtered = filtered.filter(p => p.receiptNumber.includes(filters.receiptNumber))
    setFilteredPayments(filtered)
  }

  const handleResetPayment = async () => {
  if (!resetPaymentId) return
  try {
    const res = await fetch(`/api/payments?id=${resetPaymentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to reset payment')
    }
    showToast('Payment reset successfully', 'success')
    setShowResetModal(false)
    setResetPassword('')
    setResetPaymentId(null)
    fetchData() // refresh list
  } catch (error: any) {
    showToast(error.message, 'error')
  }
}



  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        {/* <Link href="/admin/payments/new" className="btn-primary">Make Payment</Link> */}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="text" placeholder="Register No" value={filters.registerNo} onChange={(e) => setFilters({ ...filters, registerNo: e.target.value })} className="input-field" />
          <input type="text" placeholder="Student Name" value={filters.studentName} onChange={(e) => setFilters({ ...filters, studentName: e.target.value })} className="input-field" />
          <select value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })} className="input-field">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filters.academicYearId} onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value })} className="input-field">
            <option value="">All Years</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
          <input type="text" placeholder="Receipt Number" value={filters.receiptNumber} onChange={(e) => setFilters({ ...filters, receiptNumber: e.target.value })} className="input-field" />
        </div>
        <button onClick={applyFilters} className="mt-4 btn-primary">Search</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr><th className="px-6 py-3">Receipt No</th><th className="px-6 py-3">Student</th><th className="px-6 py-3">Department</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {filteredPayments.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4">{p.receiptNumber}</td>
                <td className="px-6 py-4">{p.student.name}<br/><span className="text-xs text-gray-500">{p.student.registerNumber}</span></td>
                <td className="px-6 py-4">{p.student.department?.name}</td>
                <td className="px-6 py-4">₹{p.amount}</td>
                <td className="px-6 py-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="px-6 py-4"><Link href={`/receipt/${p.id}`} target="_blank" className="text-blue-600"><EyeIcon className="w-5 h-5" /></Link></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
  <button
    onClick={() => {
      setResetPaymentId(p.id)
      setShowResetModal(true)
    }}
    className="text-red-600 hover:text-red-800"
    title="Reset Payment"
  >
    <TrashIcon className="w-5 h-5" />
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showResetModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Reset Payment</h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter your admin password to permanently delete this payment record.
      </p>
      <input
        type="password"
        placeholder="Admin Password"
        value={resetPassword}
        onChange={(e) => setResetPassword(e.target.value)}
        className="input-field mb-4"
        autoFocus
      />
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowResetModal(false)
            setResetPassword('')
            setResetPaymentId(null)
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button onClick={handleResetPayment} className="btn-primary bg-red-600 hover:bg-red-700">
          Confirm Reset
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  )
}