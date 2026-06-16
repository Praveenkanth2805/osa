'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return <div>{children}</div>
}