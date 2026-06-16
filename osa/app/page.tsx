'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/department/dashboard')
      }
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, session, router])

  return <LoadingSpinner />
}