'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const adminMenuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Students', href: '/admin/students', icon: UsersIcon },
  { name: 'Payments History', href: '/admin/payments', icon: CreditCardIcon },
  { name: 'Bill', href: '/admin/bills', icon: DocumentTextIcon },
  { name: 'Academic Years', href: '/admin/academic-years', icon: CalendarIcon },
  { name: 'Departments', href: '/admin/departments', icon: BuildingLibraryIcon },
  { name: 'Courses', href: '/admin/courses', icon: BookOpenIcon },
  { name: 'Department Users', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Archive', href: '/admin/archive', icon: ArchiveBoxIcon },
]

const departmentMenuItems = [
  { name: 'Dashboard', href: '/department/dashboard', icon: HomeIcon },
  { name: 'Students', href: '/department/students', icon: UsersIcon },
  { name: 'Payments', href: '/department/payments', icon: CreditCardIcon },
  { name: 'Bill', href: '/department/bills', icon: DocumentTextIcon }

]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const menuItems = isAdmin ? adminMenuItems : departmentMenuItems

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-primary-700 text-white flex flex-col">
      <div className="p-4 border-b border-primary-600">
        <h1 className="text-xl font-bold">Old Students' Association Fee Management</h1>
        <p className="text-sm text-primary-200 mt-1">
          {session?.user?.name}
        </p>
        <p className="text-xs text-primary-300">
          {isAdmin ? 'Admin' : session?.user?.departmentName}
        </p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto sidebar-scroll">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-800 text-white'
                      : 'text-primary-100 hover:bg-primary-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-primary-600">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-primary-100 hover:bg-primary-800 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}