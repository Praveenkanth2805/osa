'use client'

import Sidebar from '@/components/Sidebar'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [showTimer, setShowTimer] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status])

  // Inactivity timer: show warning at 14 minutes, logout at 15
  useEffect(() => {
    let warningTimer: NodeJS.Timeout
    let logoutTimer: NodeJS.Timeout

    const resetTimer = () => {
      if (warningTimer) clearTimeout(warningTimer)
      if (logoutTimer) clearTimeout(logoutTimer)
      setShowTimer(false)
      warningTimer = setTimeout(() => setShowTimer(true), 14 * 60 * 1000)
      logoutTimer = setTimeout(() => {
        // Auto logout after 15 minutes
        window.location.href = '/api/auth/signout'
      }, 15 * 60 * 1000)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (warningTimer) clearTimeout(warningTimer)
      if (logoutTimer) clearTimeout(logoutTimer)
    }
  }, [])

  if (status === 'loading') {
    return <LoadingSpinner />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
      
      {showTimer && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          You will be logged out in 1 minute due to inactivity
        </div>
      )}
    </div>
  )
}