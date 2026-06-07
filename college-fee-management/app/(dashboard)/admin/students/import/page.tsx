'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ImportStudentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      showToast('Please select a file', 'error')
      return
    }

    setLoading(true)
    setErrors([])
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        throw new Error(data.error || 'Import failed')
      }
      showToast(`Imported ${data.imported} students successfully`, 'success')
      router.push('/admin/students')
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import Students from Excel</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Excel or CSV File (.xlsx or .csv)</label>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full" required />
            <p className="text-xs text-gray-500 mt-1">Required columns: Register Number, Name, Gender, Mobile, Department Code, Course Code, Academic Year</p>
          </div>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? <LoadingSpinner /> : 'Import'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}