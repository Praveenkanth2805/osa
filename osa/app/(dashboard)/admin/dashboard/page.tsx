'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { DashboardStats } from '@/types'
import {
  CurrencyRupeeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import DashboardHeader from '@/components/DashboardHeader'


export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      showToast('Failed to load dashboard data', 'error')
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
    { title: "Today's Payments", value: stats?.todayPayments || 0, icon: CalendarDaysIcon, color: 'bg-indigo-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Statistics</h2>
          <div className="space-y-3">
            {stats?.departmentStats.map((dept, index) => (
              <div key={index} className="border-b pb-3">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{dept.departmentName}</span>
                  <span className="text-sm text-gray-600">
                    {dept.paid}/{dept.total} Paid
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2"
                    style={{ width: `${(dept.paid / dept.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-600">Collection: ₹{dept.collection.toLocaleString()}</span>
                  <span className="text-gray-600">Unpaid: {dept.unpaid}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {stats?.recentPayments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">{payment.student?.name}</p>
                  <p className="text-sm text-gray-600">{payment.receiptNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{payment.amount}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}