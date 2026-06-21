'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Student, Payment } from '@/types'

interface ReportData {
  student: Student
  hasPayment: boolean
}

interface ReportsListProps {
  role: 'ADMIN' | 'DEPARTMENT'
}

export default function ReportsList({ role }: ReportsListProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all', // 'all', 'paid', 'unpaid'
  })
  const { showToast } = useToast()

  const isAdmin = role === 'ADMIN'

  // Set default date range: first day of current month to today
  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const from = firstDay.toISOString().split('T')[0]
    const to = now.toISOString().split('T')[0]
    setFilters({ fromDate: from, toDate: to, status: 'all' })
  }, [])

  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      fetchReport()
    }
  }, [filters])
  const [printLoading, setPrintLoading] = useState(false)

const handlePrint = async () => {
  const confirmed = window.confirm('Are you sure you want to print this report?')
  if (!confirmed) return

  setLoading(true)
  try {
    const res = await fetch('/api/reports/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        status: filters.status,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 404) {
        showToast('No records found to print', 'warning')
      } else {
        throw new Error(data.error || 'Failed to print')
      }
    } else {
      showToast('Print job sent successfully', 'success')
    }
  } catch (error: any) {
    showToast(error.message, 'error')
  } finally {
    setLoading(false)
  }
}

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        status: filters.status,
      })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      const data = await res.json()
    if (data.length === 0) {
  showToast('No records found for the selected filters', 'warning')
}
      setReportData(data)
    } catch (error) {
      showToast('Failed to load report', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const params = new URLSearchParams({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        status: filters.status,
      })
      const res = await fetch(`/api/reports/pdf?${params}`)
       if (!res.ok) {
      const errorData = await res.json()
      showToast(errorData.error || 'Failed to generate PDF', 'error')
      return
    }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${filters.fromDate}-${filters.toDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showToast('Failed to download PDF', 'error')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleDownloadPDF} className="btn-primary bg-blue-600 hover:bg-blue-700">
              Download PDF
            </button>
            <button
  onClick={handlePrint}
  disabled={printLoading}
  className="btn-primary bg-green-600 hover:bg-green-700"
>
  {printLoading ? 'Printing...' : 'Print Report'}
</button>

          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.map((item, index) => (
              <tr key={item.student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.student.department?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.hasPayment ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Paid</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Unpaid</span>
                  )}
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No records found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}