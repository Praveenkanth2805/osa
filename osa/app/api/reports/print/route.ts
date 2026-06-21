import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { print } from 'pdf-to-printer'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { fromDate, toDate, status } = body

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'From and To dates required' }, { status: 400 })
  }

  // Reuse the same PDF generation logic (or factor it out)
  // To avoid duplication, we could extract to a shared function, but for now copy the logic.
  // We'll generate the PDF and save to temp file.

  const from = new Date(fromDate)
  const to = new Date(toDate)
  to.setHours(23, 59, 59, 999)

  const whereStudent: any = { isArchived: false }
  if (session.user.role !== 'ADMIN') {
    whereStudent.departmentId = session.user.departmentId
  }
  const students = await prisma.student.findMany({
    where: whereStudent,
    include: { department: true },
  })
  const studentIds = students.map(s => s.id)
  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      paymentDate: { gte: from, lte: to },
    },
    select: { studentId: true, amount: true },
  })
  const paymentMap = new Map(payments.map(p => [p.studentId, p.amount]))
  const paidStudentIds = new Set(payments.map(p => p.studentId))
  let totalAmount = 0
  for (const p of payments) totalAmount += p.amount

  let reportData = students.map(student => ({
    student,
    hasPayment: paidStudentIds.has(student.id),
  }))
  if (status === 'paid') {
    reportData = reportData.filter(d => d.hasPayment)
  } else if (status === 'unpaid') {
    reportData = reportData.filter(d => !d.hasPayment)
  }

  // PDF generation (same as above)
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842])
  const width = page.getWidth()
  const height = page.getHeight()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 60
  const margin = 50

  // Logo and header (centered)
  const logoPath = path.join(process.cwd(), 'public/logos/college-logo.png')
  if (fs.existsSync(logoPath)) {
    const logo = await pdfDoc.embedPng(fs.readFileSync(logoPath))
    page.drawImage(logo, { x: margin, y: y - 30, width: 60, height: 60 })
  }

  const title = 'Arignar Anna Government Arts College'
  const titleWidth = boldFont.widthOfTextAtSize(title, 14)
  page.drawText(title, { x: (width - titleWidth) / 2, y, size: 14, font: boldFont })
  y -= 18
  const line1 = 'Villupuram-605 602.'
  page.drawText(line1, { x: (width - font.widthOfTextAtSize(line1, 10)) / 2, y, size: 10, font })
  y -= 18
  const line2 = "Old Students' Association"
  page.drawText(line2, { x: (width - boldFont.widthOfTextAtSize(line2, 11)) / 2, y, size: 11, font: boldFont })
  y -= 25
  const line3 = 'REPORT'
  page.drawText(line3, { x: (width - boldFont.widthOfTextAtSize(line3, 14)) / 2, y, size: 14, font: boldFont })
  y -= 20
  page.drawText(`Date Range: ${fromDate} to ${toDate}`, { x: margin, y, size: 10, font })
  y -= 15
  page.drawText(`Status: ${status.toUpperCase()}`, { x: margin, y, size: 10, font })
  y -= 25

  const col1 = 30
  const col2 = 150
  const col3 = 250
  const col4 = 400
  const rowHeight = 20

  const drawHeader = () => {
    page.drawText('S.No', { x: margin + col1, y, size: 10, font: boldFont })
    page.drawText('Name', { x: margin + col2, y, size: 10, font: boldFont })
    page.drawText('Department', { x: margin + col3, y, size: 10, font: boldFont })
    page.drawText('Status', { x: margin + col4, y, size: 10, font: boldFont })
    y -= 10
    page.drawLine({ start: { x: margin, y: y+5 }, end: { x: width - margin, y: y+5 }, thickness: 0.5, color: rgb(0,0,0) })
    y -= 15
  }

  drawHeader()

  let row = 1
  for (const item of reportData) {
    const student = item.student
    const statusText = item.hasPayment ? 'Paid' : 'Unpaid'
    page.drawText(String(row), { x: margin + col1, y, size: 9, font })
    page.drawText(student.name, { x: margin + col2, y, size: 9, font })
    page.drawText(student.department?.name || '-', { x: margin + col3, y, size: 9, font })
    page.drawText(statusText, { x: margin + col4, y, size: 9, font })
    y -= rowHeight
    row++
    if (y < 50) {
      page = pdfDoc.addPage([595, 842])
      y = page.getHeight() - 50
      drawHeader()
    }
  }

  if (status === 'paid' || status === 'all') {
    const paidCount = reportData.filter(d => d.hasPayment).length
    if (paidCount > 0) {
      y -= 5
      page.drawLine({ start: { x: margin, y: y+5 }, end: { x: width - margin, y: y+5 }, thickness: 1, color: rgb(0,0,0) })
      y -= 15
      page.drawText('Total', { x: margin + col2, y, size: 10, font: boldFont })
      page.drawText(`₹${totalAmount.toLocaleString()}`, { x: margin + col4, y, size: 10, font: boldFont })
    }
  }

  page.drawText(`Total Students: ${reportData.length}`, { x: margin, y: 40, size: 10, font: boldFont })

  const pdfBytes = await pdfDoc.save()

  // Save to temp file
  const tempFile = path.join(os.tmpdir(), `report-${Date.now()}.pdf`)
  fs.writeFileSync(tempFile, pdfBytes)

  try {
    // Get printer name from env or use default
    const printerName = process.env.PRINTER_NAME || undefined
    await print(tempFile, { printer: printerName })
    return NextResponse.json({ success: true, message: 'Print job sent successfully' })
  } catch (error: any) {
    console.error('Print error:', error)
    return NextResponse.json({ error: error.message || 'Failed to print' }, { status: 500 })
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
  }
}