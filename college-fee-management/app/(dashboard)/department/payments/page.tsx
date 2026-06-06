'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Payment, Student } from '@/types'
import { EyeIcon } from '@heroicons/react/24/outline'

export default function DepartmentPaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { student: Student })[]>([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments')
      const data = await res.json()
      setPayments(data)
      setFilteredPayments(data)
    } catch (error) {
      showToast('Failed to load payments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearch(term)
    const lower = term.toLowerCase()
    setFilteredPayments(
      payments.filter(p =>
        p.receiptNumber.toLowerCase().includes(lower) ||
        p.student.name.toLowerCase().includes(lower) ||
        p.student.registerNumber.toLowerCase().includes(lower)
      )
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        <Link href="/department/payments/new" className="btn-primary">
          Make Payment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Search by receipt no, student name or register no..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Receipt No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.receiptNumber}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{p.student.name}</div>
                  <div className="text-xs text-gray-500">{p.student.registerNumber}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">₹{p.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Link href={`/receipt/${p.id}`} className="text-blue-600 hover:text-blue-800">
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}