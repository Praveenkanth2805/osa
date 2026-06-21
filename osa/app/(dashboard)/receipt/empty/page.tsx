'use client'

import { useRouter } from 'next/navigation'

function EmptyReceiptCard({ copyType }: { copyType: string }) {
  return (
    <div className="w-1/2 px-4 print:px-2">
      <div className="relative bg-white shadow-lg print:shadow-none h-full flex flex-col overflow-hidden">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
          <img
            src="/logos/tn-govt-logo.png"
            alt="Government of Tamil Nadu"
            className="w-72 h-auto"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="text-center border-b pb-3 mb-4">
            <div className="flex justify-between items-start">
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

          {/* Receipt details – no QR, only blank fields */}
          <div className="flex justify-between items-start ml-2 mt-2">
            <div className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="font-bold">Receipt No:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
              <span className="font-bold">Date:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
            </div>
            {/* QR code removed */}
          </div>

          {/* Student Details */}
          <div className="border-t pt-2 mt-2">
            <p className="ml-2 font-semibold mb-2">Student Details</p>
            <div className="ml-2 grid grid-cols-[120px_1.5fr_70px_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="font-bold">Name:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
              <span className="font-bold">Course:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
              <span className="font-bold">Roll No:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
              <span className="font-bold">Dept:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
              <span className="font-bold">Course Duration:</span>
              <span className="border-b border-gray-400 border-dashed inline-block w-32">_______________</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-2 mt-2">
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
                  <td className="text-right px-2 py-1 border-b border-gray-400 border-dashed">___________</td>
                </tr>
                <tr className="font-bold border-t">
                  <td className="px-2 py-1">Total</td>
                  <td className="text-right px-2 py-1 border-b border-gray-400 border-dashed">___________</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-right text-base text-gray-600 pt-2 px-2">
                    Amount in words: <span className="border-b border-gray-400 border-dashed inline-block w-64">_________________________________</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t mt-4 pt-2 text-right text-xs">
            <span className="border-t mt-12 border-gray-400 inline-block pt-1 px-4">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmptyReceiptPage() {
  const router = useRouter()
  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-[297mm] mx-auto relative print:max-w-none">
        <div className="relative z-10 flex flex-row print:flex-row print:justify-center">
          <EmptyReceiptCard copyType="College Copy" />
          <div className="mx-8 w-0.5 bg-gray-400 border-l-2 border-dashed print:border-dashed print:border-gray-500 print:w-0.5"></div>
          <EmptyReceiptCard copyType="Student Copy" />
        </div>

        <div className="mt-6 flex justify-center gap-4 print:hidden">
          <button onClick={handlePrint} className="btn-primary px-6 py-2">Print Empty Receipt</button>
          <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          body { margin: 0; padding: 0; background: white; }
          .bg-gray-100, .min-h-screen { background: white !important; }
          .shadow-lg, .shadow { box-shadow: none !important; }
          .border { border-color: #ccc !important; }
        }
      `}</style>
    </div>
  )
}