'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import * as XLSX from 'xlsx'

export default function DepartmentImportStudentsPage() {
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
      router.push('/department/students')
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const downloadSample = () => {
    // Create sample Excel file
    const headers = ['Register Number', 'Name', 'Gender', 'Mobile', 'Course Code', 'Academic Year']
    const sampleRow = ['2024001', 'name', 'MALE', '9876543210', 'B214', '2023-26']
    const wsData = [headers, sampleRow]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_import_sample.xlsx')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import Students (Department)</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Excel File (.xlsx, .xls) or CSV</label>
              <button type="button" onClick={downloadSample} className="text-sm text-primary-600 hover:text-primary-800 underline">
                Download Sample Format
              </button>
            </div>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full" required />
            <p className="text-xs text-gray-500 mt-1">
              Required columns: Register Number, Name, Gender (MALE/FEMALE/OTHER), Mobile (10 digits), 
              Course Code, Academic Year (e.g., 2023-26). Department is auto-assigned to your department.
            </p>
          </div>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-semibold">Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700 max-h-60 overflow-y-auto">
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