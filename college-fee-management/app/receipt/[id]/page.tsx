'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Payment, Student, AcademicYear } from '@/types'
import QRCode from 'qrcode'

// Convert number to words (Indian system)
function numberToWords(num: number): string {
  if (num === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  function convertBelowThousand(n: number): string {
    let str = ''
    const hundred = Math.floor(n / 100)
    const remainder = n % 100
    if (hundred > 0) {
      str += ones[hundred] + ' Hundred'
      if (remainder > 0) str += ' '
    }
    if (remainder >= 20) {
      str += tens[Math.floor(remainder / 10)]
      const unit = remainder % 10
      if (unit > 0) str += ' ' + ones[unit]
    } else if (remainder >= 10) {
      str += teens[remainder - 10]
    } else if (remainder > 0) {
      str += ones[remainder]
    }
    return str.trim()
  }

  let result = ''
  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000

  if (crore > 0) {
    result += convertBelowThousand(crore) + ' Crore'
    if (lakh > 0 || thousand > 0 || remainder > 0) result += ' '
  }
  if (lakh > 0) {
    result += convertBelowThousand(lakh) + ' Lakh'
    if (thousand > 0 || remainder > 0) result += ' '
  }
  if (thousand > 0) {
    result += convertBelowThousand(thousand) + ' Thousand'
    if (remainder > 0) result += ' '
  }
  if (remainder > 0) {
    result += convertBelowThousand(remainder)
  }
  return result.trim()
}

// Single receipt component to avoid code duplication
function ReceiptCard({ payment, qrCodeUrl, copyType }: { 
  payment: Payment & { student: Student; academicYear: AcademicYear }
  qrCodeUrl: string
  copyType: 'College Copy' | 'Student Copy'
}) {
  const amountInWords = numberToWords(payment.amount)

  return (
    <div className="w-1/2 px-4 print:px-2">
      <div className="relative bg-white shadow-lg print:shadow-none h-full flex flex-col overflow-hidden">
        {/* Header remains same */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
  <img
    src="/logos/tn-govt-logo.png"
    alt="Government of Tamil Nadu"
    className="w-72 h-auto"
  />
</div>
        <div className="relative z-10 text-center border-b pb-3 mb-4">
          <div className=" relative z-10 flex justify-between items-start">
            <img src="/logos/college-logo.png" alt="Logo" className="ml-6 mt-6 h-20 w-auto" />
            <div className="flex-1">
              <h1 className="font-bold">Arignar Anna Government Arts College</h1>
              <p className="text-sm font-semibold">Villupuram-605 602.</p>
              <p className="text-[15px] font-bold">Old Students' Association</p>
            </div>
            <div className="w-12"></div>
          </div>
          <h2 className="text-lg font-bold mt-2">PAYMENT RECEIPT</h2>
          <p className="text-sm font-semibold">{copyType}</p>
        </div>

        {/* Details with fixed-width labels */}
        <div className="flex-1 text-sm space-y-4">
          {/* Row: Receipt details (left) + QR (right) */}
          <div className="flex justify-between items-start">
            <div className="ml-2 mt-2 grid grid-cols-[120px_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="font-bold">Receipt No:</span>
              <span>{payment.receiptNumber.split('-')[1]}</span>
              <span className="font-bold">Date:</span>
              <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
            </div>
            <div className="bg-gray-50 p-1 rounded border">
              <img src={qrCodeUrl} alt="QR" className="h-16 w-16" />
            </div>
          </div>

          {/* Student Details – using same grid layout */}
          <div className="border-t pt-2">
            <p className="ml-2 font-semibold mb-2">Student Details</p>
            <div className="ml-2 grid grid-cols-[120px_1.5fr_70px_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="font-bold">Name:</span>
              <span>{payment.student.name}</span>
              <span className="font-bold">Course:</span>
              <span>{payment.student.course?.name}</span>
              <span className="font-bold">Roll No:</span>
              <span>{payment.student.registerNumber}</span>
              <span className="font-bold">Dept:</span>
              <span>{payment.student.department?.name}</span>
              <span className="font-bold">Course Duration:</span>
              <span>{payment.academicYear.year}</span>
            </div>
          </div>

          {/* Payment Details Table – already aligned */}
          <div className="border-t pt-2">
            <p className="ml-2 font-semibold mb-2">Payment Details</p>
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-2 py-1">Description</th>
                  <th className="text-right px-2 py-1">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1">Old Students' Association Fee</td>
                  <td className="text-right px-2 py-1">{payment.amount.toLocaleString()}</td>
                </tr>
                <tr className="font-bold border-t">
                  <td className="px-2 py-1">Total</td>
                  <td className="text-right px-2 py-1">₹{payment.amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-right text-base text-gray-600 pt-2 px-2">
                    Amount in words: {amountInWords} only
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t mt-4 pt-2 text-right text-xs">
          <span className="border-t mt-12 border-gray-400 inline-block pt-1 px-4">Authorized Signature</span>
        </div>
      </div>
    </div>
  )
}

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
      const qrData = JSON.stringify({
        receiptNo: data.receiptNumber,
        studentName: data.student.name,
        regNo: data.student.registerNumber,
        amount: data.amount,
        date: new Date(data.paymentDate).toLocaleDateString(),
        academicYear: data.academicYear.year,
      })
      const qrUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 })
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
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      {/* A4 Landscape container */}
      <div className="max-w-[297mm] mx-auto relative print:max-w-none">
        {/* Background Watermark - centered on whole page */}

        {/* Two receipts side by side with cut line */}
        <div className="relative z-10 flex flex-row print:flex-row print:justify-center">
          {/* Left receipt: College Copy */}
          <ReceiptCard payment={payment} qrCodeUrl={qrCodeUrl} copyType="College Copy" />
          
          {/* Vertical cut/dotted line */}
          <div className="mx-8 w-0.5 bg-gray-400 border-l-2 border-dashed print:border-dashed print:border-gray-500 print:w-0.5"></div>
          
          {/* Right receipt: Student Copy */}
          <ReceiptCard payment={payment} qrCodeUrl={qrCodeUrl} copyType="Student Copy" />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-center gap-4 print:hidden">
          <button onClick={handlePrint} className="btn-primary px-6 py-2">Print Receipt</button>
          {/* <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Download PDF
          </button> */}
        </div>
      </div>

      {/* Print-specific CSS to enforce A4 landscape and two-column layout */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .bg-gray-100, .min-h-screen {
            background: white !important;
          }
          .shadow-lg, .shadow {
            box-shadow: none !important;
          }
          .border {
            border-color: #ccc !important;
          }
        }
      `}</style>
    </div>
  )
}