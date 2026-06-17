'use client'

import { useState, useEffect } from 'react'
import { useSystemDate } from '@/contexts/SystemDateContext'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'


export default function DashboardHeader() {
  const { data: session } = useSession()
  const { currentDate, setSystemDate, resetToCurrentDate } = useSystemDate()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showPopup, setShowPopup] = useState(true)
  const [showHighlight, setShowHighlight] = useState(true)
  const [tempDate, setTempDate] = useState<string>('')
  const [liveTime, setLiveTime] = useState(new Date())

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'OFFICE_USER'

  const handleDateChange = () => {
    if (tempDate) {
      const newDate = new Date(tempDate)
      setSystemDate(newDate)
      setShowDatePicker(false)
    }
  }



  useEffect(() => {
  const timer = setInterval(() => {
    setLiveTime(new Date())
  }, 1000)

  return () => clearInterval(timer)
}, [])

  const handleReset = () => {
    resetToCurrentDate()
    setShowDatePicker(false)
  }

  const formattedDate = currentDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const formattedTime = liveTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="flex justify-between items-center bg-white shadow-sm px-6 py-3 border-b">
      
    {showPopup && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-semibold mb-2">
        System Date & Time
      </h3>

      <p className="text-gray-600 mb-4">
        Click the ⚙️ icon near the date and time to change the system date.
      </p>

      <div className="flex justify-end">
        <button
         onClick={() => {
  setShowPopup(false)

  setTimeout(() => {
    setShowHighlight(false)
  }, 5000)
}}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
)}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Welcome, {session?.user?.name}</h2>
        
      </div>
     <div className="flex items-center gap-3 text-right text-sm text-gray-600">
 <div
  className={`text-right text-sm text-gray-600 rounded-lg p-2 transition-all duration-500 ${
    showHighlight
      ? 'ring-4 ring-blue-400 bg-blue-50 animate-pulse'
      : ''
  }`}
>
  <div className="font-medium">{formattedDate}</div>
  <div className="text-xs">{formattedTime}</div>
</div>

  {showDatePicker && (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
      onClick={() => setShowDatePicker(false)}
    />
  )}
 <div className="relative">
  {isAdmin && (
    <button
      onClick={() => setShowDatePicker(!showDatePicker)}
      className="text-gray-500 hover:text-gray-700 transition"
      title="Change system date"
    >
      <Cog6ToothIcon className="w-5 h-5" />
    </button>
  )}

  {showDatePicker && isAdmin && (
    <div className="absolute right-0 translate-x-[-250px] top-8 bg-white shadow-lg rounded-lg p-4 border w-72 z-[60]">
      <p className="text-sm font-medium mb-2">
        Set System Date (for this session only)
      </p>

      <input
        type="datetime-local"
        value={tempDate}
        onChange={(e) => setTempDate(e.target.value)}
        className="input-field text-sm"
      />

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDateChange}
          className="btn-primary text-sm px-3 py-1"
        >
          Apply
        </button>

        <button
          onClick={handleReset}
          className="btn-secondary text-sm px-3 py-1"
        >
          Reset to Now
        </button>

        <button
          onClick={() => setShowDatePicker(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>
</div>
    </div>
  )
}