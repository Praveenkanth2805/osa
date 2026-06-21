import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateReportPdf } from '@/lib/reportPdf'
import { print } from 'pdf-to-printer'
import os from 'os'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fromDate, toDate, status } = await req.json()

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'From and To dates required' }, { status: 400 })
  }

  const pdfBuffer = await generateReportPdf(
    fromDate,
    toDate,
    status,
    session.user.role !== 'ADMIN' ? session.user.departmentId : undefined
  )

  if (!pdfBuffer) {
    return NextResponse.json({ error: 'No records found' }, { status: 404 })
  }

  try {
    // Get default printer
    const printers = await getPrinters()
    if (printers.length === 0) {
      return NextResponse.json({ error: 'No printer found' }, { status: 404 })
    }

    const tempFile = path.join(os.tmpdir(), `report-${Date.now()}.pdf`)
    fs.writeFileSync(tempFile, pdfBuffer)

    // Print using default printer
    await print(tempFile)

    fs.unlinkSync(tempFile)

    return NextResponse.json({ success: true, message: 'Print job sent successfully' })
  } catch (error) {
    console.error('Print error:', error)
    return NextResponse.json({ error: 'Failed to print' }, { status: 500 })
  }
}

async function getPrinters() {
  // Use 'pdf-to-printer' built-in method
  const { getPrinters } = await import('pdf-to-printer')
  return getPrinters()
}