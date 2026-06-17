import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { SystemDateProvider } from '@/contexts/SystemDateContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'College Fee Management System',
  description: 'Arignar Anna Government Arts College, Villupuram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <SystemDateProvider>
            {children}
            </SystemDateProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}