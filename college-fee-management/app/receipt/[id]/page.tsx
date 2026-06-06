'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Payment, Student, AcademicYear } from '@/types'
import QRCode from 'qrcode'

export default function ReceiptPage() {
  const { id } = useParams()
  const [payment, setPayment] = useState<(Payment & { student: Student; academicYear: AcademicYear }) | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    fetchReceipt()
  }, [id])

  const fetchReceipt = async () => {
    try {
      const res = await fetch(`/api/receipts/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayment(data)
      
      // QR code with detailed receipt info
      const qrData = JSON.stringify({
        receiptNo: data.receiptNumber,
        studentName: data.student.name,
        regNo: data.student.registerNumber,
        amount: data.amount,
        date: new Date(data.paymentDate).toLocaleDateString(),
        academicYear: data.academicYear.year,
      })
      const qrUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 1 })
      setQrCodeUrl(qrUrl)
    } catch (error) {
      showToast('Failed to load receipt', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()
  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/receipts/${id}/pdf`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${payment?.receiptNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showToast('Failed to download PDF', 'error')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!payment) return <div>Receipt not found</div>

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto relative">
        {/* Tamil Nadu Government Watermark */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-10 print:opacity-10">
          <img src="/logos/tn-govt-logo.png" alt="Government of Tamil Nadu" className="w-96 h-auto" />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none relative z-10">
          {/* Header: Only College Logo on left */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div>
              <img src="/logos/college-logo.png" alt="College Logo" className="h-16 w-auto" />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Arignar Anna Government Arts College
              </h1>
              <p className="text-gray-600">Villupuram, Tamil Nadu</p>
            </div>
            {/* University logo removed */}
            <div className="w-16"></div> {/* spacer for balance */}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">FEE PAYMENT RECEIPT</h2>
            <p className="text-sm text-gray-600">Original Copy</p>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Receipt No:</strong> {payment.receiptNumber}</p>
              <p><strong>Date:</strong> {new Date(payment.paymentDate).toLocaleDateString()}</p>
              <p><strong>Academic Year:</strong> {payment.academicYear.year}</p>
            </div>
            <div className="text-right">
              <div className="inline-block p-2 bg-gray-50 rounded">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="h-24 w-24" />}
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="border-t border-b py-4 mb-6">
            <h3 className="font-semibold mb-3">Student Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p><strong>Register Number:</strong> {payment.student.registerNumber}</p>
                <p><strong>Student Name:</strong> {payment.student.name}</p>
                <p><strong>Gender:</strong> {payment.student.gender}</p>
              </div>
              <div>
                <p><strong>Department:</strong> {payment.student.department?.name}</p>
                <p><strong>Course:</strong> {payment.student.course?.name}</p>
                <p><strong>Mobile:</strong> {payment.student.mobile}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">Alumni Association Fee - {payment.student.course?.name}</td>
                  <td className="px-4 py-2 text-right">{payment.amount.toLocaleString()}</td>
                </tr>
                <tr className="border-t font-bold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">₹{payment.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount in words: Rupees {payment.amount} only</p>
                <p className="text-xs text-gray-500 mt-2">This is a computer generated receipt</p>
              </div>
              <div className="text-right">
                <p className="mt-8 pt-2 border-t border-gray-300">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4 print:hidden">
          <button onClick={handlePrint} className="btn-primary">Print Receipt</button>
          <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}