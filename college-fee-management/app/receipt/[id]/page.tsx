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
        {/* Background Watermark - Tamil Nadu Government Logo */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-10 print:opacity-10 z-0">
          <img src="/logos/tn-govt-logo.png" alt="Government of Tamil Nadu" className="w-80 h-auto" />
        </div>

        {/* Receipt Card with Professional Margins */}
        <div className="relative z-10 bg-white rounded-lg shadow-lg print:shadow-none overflow-hidden">
          <div className="p-8 md:p-10">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
              <div className="flex-shrink-0">
                <img src="/logos/college-logo.png" alt="College Logo" className="h-16 w-auto" />
              </div>
              <div className="text-center flex-1 px-4">
                <h1 className="text-2xl font-bold text-gray-900">Arignar Anna Government Arts College</h1>
                <p className="text-gray-600">Villupuram, Tamil Nadu</p>
                <p className="text-sm text-gray-500">(Affiliated to Thiruvalluvar University)</p>
              </div>
              <div className="w-16"></div> {/* spacer */}
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Fee Payment Receipt</h2>
              <p className="text-sm text-gray-500">Original Copy</p>
            </div>

            {/* Receipt Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <p><span className="font-semibold">Receipt No:</span> {payment.receiptNumber}</p>
                <p><span className="font-semibold">Date:</span> {new Date(payment.paymentDate).toLocaleDateString()}</p>
                <p><span className="font-semibold">Academic Year:</span> {payment.academicYear.year}</p>
              </div>
              <div className="flex justify-end">
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="h-24 w-24" />}
                </div>
              </div>
            </div>

            {/* Student Details Section */}
            <div className="border-t border-b border-gray-200 py-6 mb-8">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Student Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium">Register Number:</span> {payment.student.registerNumber}</p>
                  <p><span className="font-medium">Student Name:</span> {payment.student.name}</p>
                  <p><span className="font-medium">Gender:</span> {payment.student.gender}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Department:</span> {payment.student.department?.name}</p>
                  <p><span className="font-medium">Course:</span> {payment.student.course?.name}</p>
                  <p><span className="font-medium">Mobile:</span> {payment.student.mobile}</p>
                </div>
              </div>
            </div>

            {/* Payment Details Table */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Payment Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm">Tuition Fee - {payment.student.course?.name}</td>
                      <td className="px-4 py-3 text-right text-sm">{payment.amount.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm">Total</td>
                      <td className="px-4 py-3 text-right text-sm">₹{payment.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount in words: Rupees {payment.amount} only</p>
                  <p className="text-xs text-gray-500 mt-2">This is a computer generated receipt</p>
                </div>
                <div className="text-right">
                  <p className="mt-8 pt-2 border-t border-gray-300 inline-block px-8">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4 print:hidden">
          <button onClick={handlePrint} className="btn-primary px-6 py-2">Print Receipt</button>
          <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}