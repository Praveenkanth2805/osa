'use client'

import { useSession, signOut } from 'next-auth/react'
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-end items-center px-8 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserCircleIcon className="w-8 h-8 text-gray-500" />
            <div className="text-sm">
              <p className="font-medium text-gray-700">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.role === 'ADMIN' ? 'Administrator' : session?.user?.departmentName}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-red-600 hover:text-red-800">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}