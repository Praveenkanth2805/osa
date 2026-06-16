'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { DashboardStats } from '@/types'
import { CurrencyRupeeIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function DepartmentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { showToast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      showToast('Failed to load dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const statCards = [
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: UserGroupIcon, color: 'bg-blue-500' },
    { title: 'Paid Students', value: stats?.paidStudents || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
    { title: 'Unpaid Students', value: stats?.unpaidStudents || 0, icon: XCircleIcon, color: 'bg-red-500' },
    { title: 'Total Collection', value: `₹${stats?.totalCollection.toLocaleString() || 0}`, icon: CurrencyRupeeIcon, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Department Dashboard - {session?.user?.departmentName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">{card.title}</p><p className="text-2xl font-bold">{card.value}</p></div>
              <div className={`${card.color} p-3 rounded-full`}><card.icon className="w-6 h-6 text-white" /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
        <div className="space-y-3">
          {stats?.recentPayments.map(payment => (
            <div key={payment.id} className="flex justify-between border-b pb-3">
              <div><p className="font-medium">{payment.student?.name}</p><p className="text-sm text-gray-600">{payment.receiptNumber}</p></div>
              <div className="text-right"><p className="font-semibold text-green-600">₹{payment.amount}</p><p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}