'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface SystemDateContextType {
  currentDate: Date
  setSystemDate: (date: Date) => void
  resetToCurrentDate: () => void
}

const SystemDateContext = createContext<SystemDateContextType | undefined>(undefined)

export function SystemDateProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  useEffect(() => {
    // Reset to current date on mount (e.g., after refresh/login)
    setCurrentDate(new Date())
  }, [])

  const setSystemDate = (date: Date) => {
    setCurrentDate(date)
  }

  const resetToCurrentDate = () => {
    setCurrentDate(new Date())
  }

  return (
    <SystemDateContext.Provider value={{ currentDate, setSystemDate, resetToCurrentDate }}>
      {children}
    </SystemDateContext.Provider>
  )
}

export function useSystemDate() {
  const context = useContext(SystemDateContext)
  if (!context) {
    throw new Error('useSystemDate must be used within SystemDateProvider')
  }
  return context
}