'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardIndex() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role === 'ADMIN') {
        redirect('/admin/dashboard')
      } else {
        redirect('/department/dashboard')
      }
    }
  }, [session, status])

  return <LoadingSpinner />
}