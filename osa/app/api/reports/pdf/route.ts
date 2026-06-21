import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fromDate = searchParams.get('fromDate')
  const toDate = searchParams.get('toDate')
  const status = searchParams.get('status') || 'all'

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'From and To dates required' }, { status: 400 })
  }

  const from = new Date(fromDate)
  const to = new Date(toDate)
  to.setHours(23, 59, 59, 999)

  // Fetch data (same as above)
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
    select: { studentId: true },
  })
  const paidStudentIds = new Set(payments.map(p => p.studentId))
  let reportData = students.map(student => ({
    student,
    hasPayment: paidStudentIds.has(student.id),
  }))
  if (status === 'paid') {
    reportData = reportData.filter(d => d.hasPayment)
  } else if (status === 'unpaid') {
    reportData = reportData.filter(d => !d.hasPayment)
  }

  // Create PDF
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842]) // A4 portrait
  const width = page.getWidth()
const height = page.getHeight()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Watermark
//   const watermarkPath = path.join(process.cwd(), 'public/logos/tn-govt-logo.png')
//   if (fs.existsSync(watermarkPath)) {
//     const watermark = await pdfDoc.embedPng(fs.readFileSync(watermarkPath))
//     const { width: w, height: h } = watermark.scale(0.25)
//     page.drawImage(watermark, {
//       x: (width - w) / 2,
//       y: (height - h) / 2,
//       width: w,
//       height: h,
//       opacity: 0.1,
//     })
//   }

  let y = height - 60
  const margin = 50

  // College Logo
  const logoPath = path.join(process.cwd(), 'public/logos/college-logo.png')
  if (fs.existsSync(logoPath)) {
    const logo = await pdfDoc.embedPng(fs.readFileSync(logoPath))
    page.drawImage(logo, { x: margin, y: y - 30, width: 60, height: 60 })
  }

  // Header
  const title = 'Arignar Anna Government Arts College'
const titleWidth = boldFont.widthOfTextAtSize(title, 14)

page.drawText(title, {
  x: (width - titleWidth) / 2,
  y,
  size: 14,
  font: boldFont
})
  y -= 18
  const line1 = 'Villupuram-605 602.'
page.drawText(line1, {
  x: (width - font.widthOfTextAtSize(line1, 10)) / 2,
  y,
  size: 10,
  font
})
  y -= 18
  const line2 = "Old Students' Association"
page.drawText(line2, {
  x: (width - boldFont.widthOfTextAtSize(line2, 11)) / 2,
  y,
  size: 11,
  font: boldFont
})
  y -= 25
  const line3 = 'REPORT'
page.drawText(line3, {
  x: (width - boldFont.widthOfTextAtSize(line3, 14)) / 2,
  y,
  size: 14,
  font: boldFont
})
  y -= 20
  page.drawText(`Date Range: ${fromDate} to ${toDate}`, { x: margin, y, size: 10, font })
  y -= 15
  page.drawText(`Status: ${status.toUpperCase()}`, { x: margin, y, size: 10, font })
  y -= 25

  // Table Header
  const col1 = 30
  const col2 = 150
  const col3 = 250
  const col4 = 400
  const rowHeight = 20

  page.drawText('S.No', { x: margin + col1, y, size: 10, font: boldFont })
  page.drawText('Name', { x: margin + col2, y, size: 10, font: boldFont })
  page.drawText('Department', { x: margin + col3, y, size: 10, font: boldFont })
  page.drawText('Status', { x: margin + col4, y, size: 10, font: boldFont })
  y -= 10
  page.drawLine({ start: { x: margin, y: y+5 }, end: { x: width - margin, y: y+5 }, thickness: 0.5, color: rgb(0,0,0) })
  y -= 15

  // Table Rows
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

  // table header again
  page.drawText('S.No', { x: margin + col1, y, size: 10, font: boldFont })
  page.drawText('Name', { x: margin + col2, y, size: 10, font: boldFont })
  page.drawText('Department', { x: margin + col3, y, size: 10, font: boldFont })
  page.drawText('Status', { x: margin + col4, y, size: 10, font: boldFont })

  y -= 25
}
  }

  // Footer
  page.drawText(`Total Students: ${reportData.length}`, { x: margin, y: 40, size: 10, font: boldFont })

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${fromDate}-${toDate}.pdf"`,
    },
  })
}