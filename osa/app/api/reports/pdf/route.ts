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

  // Fetch students
  const whereStudent: any = { isArchived: false }
  if (session.user.role !== 'ADMIN') {
    whereStudent.departmentId = session.user.departmentId
  }
  const students = await prisma.student.findMany({
    where: whereStudent,
    include: { department: true },
  })
  const studentIds = students.map(s => s.id)

  // Fetch payments with amount
  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      paymentDate: { gte: from, lte: to },
    },
    select: { studentId: true, amount: true },
  })
  const paymentMap = new Map(payments.map(p => [p.studentId, p.amount]))
  const paidStudentIds = new Set(payments.map(p => p.studentId))

  // Build report data
let reportData = students.map(student => ({
  student,
  hasPayment: paidStudentIds.has(student.id),
  amount: paymentMap.get(student.id) || 0,
}))

// Apply status filter
if (status === 'paid') {
  reportData = reportData.filter(d => d.hasPayment)
} else if (status === 'unpaid') {
  reportData = reportData.filter(d => !d.hasPayment)
}

// No data – return error
if (reportData.length === 0) {
  return NextResponse.json(
    { error: 'No records found for the selected filters.' },
    { status: 404 }
  )
}

  // Calculate total amount (sum of paid students)
  const totalAmount = reportData
    .filter(d => d.hasPayment)
    .reduce((sum, d) => sum + d.amount, 0)

  // Create PDF
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842]) // A4 portrait
  const width = page.getWidth()
  const height = page.getHeight()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Watermark (optional – uncomment if needed)
  // const watermarkPath = path.join(process.cwd(), 'public/logos/tn-govt-logo.png')
  // if (fs.existsSync(watermarkPath)) {
  //   const watermark = await pdfDoc.embedPng(fs.readFileSync(watermarkPath))
  //   const { width: w, height: h } = watermark.scale(0.25)
  //   page.drawImage(watermark, {
  //     x: (width - w) / 2,
  //     y: (height - h) / 2,
  //     width: w,
  //     height: h,
  //     opacity: 0.1,
  //   })
  // }

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
    font: boldFont,
  })
  y -= 18
  const line1 = 'Villupuram-605 602.'
  page.drawText(line1, {
    x: (width - font.widthOfTextAtSize(line1, 10)) / 2,
    y,
    size: 10,
    font,
  })
  y -= 18
  const line2 = "Old Students' Association"
  page.drawText(line2, {
    x: (width - boldFont.widthOfTextAtSize(line2, 11)) / 2,
    y,
    size: 11,
    font: boldFont,
  })
  y -= 25
  const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  return `${day}-${month}-${year}`
}
const formattedFromDate = formatDate(fromDate)
const formattedToDate = formatDate(toDate)
  const line3 = `REPORT - ${formattedFromDate} to ${formattedToDate}`
  page.drawText(line3, {
    x: (width - boldFont.widthOfTextAtSize(line3, 14)) / 2,
    y,
    size: 14,
    font: boldFont,
  })
  y -= 20
  // page.drawText(`Date Range: ${fromDate} to ${toDate}`, { x: margin, y, size: 10, font })
  y -= 15
  page.drawText(`Status: ${status.toUpperCase()}`, { x: margin, y, size: 10, font })
  y -= 25

  // Table Header
  const col1 = 30      // S.No
  const col2 = 150     // Name
  const col3 = 270     // Department
  const col4 = 400     // Amount/Status
  const rowHeight = 20

  page.drawText('S.No', { x: margin + col1, y, size: 10, font: boldFont })
  page.drawText('Name', { x: margin + col2, y, size: 10, font: boldFont })
  page.drawText('Department', { x: margin + col3, y, size: 10, font: boldFont })
  page.drawText('Amount', { x: margin + col4, y, size: 10, font: boldFont })
  y -= 10
  page.drawLine({
    start: { x: margin, y: y + 5 },
    end: { x: width - margin, y: y + 5 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  y -= 15

  // Table Rows
  let row = 1
  for (const item of reportData) {
    const student = item.student
    const displayText = item.hasPayment ? `Rs.${item.amount}` : 'Unpaid'
    page.drawText(String(row), { x: margin + col1, y, size: 9, font })
    page.drawText(student.name, { x: margin + col2, y, size: 9, font })
    page.drawText(student.department?.name || '-', { x: margin + col3, y, size: 9, font })
    page.drawText(displayText, { x: margin + col4, y, size: 9, font })
    y -= rowHeight
    row++

    // If we run out of space, add a new page
    if (y < 60) {
      page = pdfDoc.addPage([595, 842])
      y = page.getHeight() - 50
      // Re‑draw table header on new page
      page.drawText('S.No', { x: margin + col1, y, size: 10, font: boldFont })
      page.drawText('Name', { x: margin + col2, y, size: 10, font: boldFont })
      page.drawText('Department', { x: margin + col3, y, size: 10, font: boldFont })
      page.drawText('Amount', { x: margin + col4, y, size: 10, font: boldFont })
      y -= 10
      page.drawLine({
        start: { x: margin, y: y + 5 },
        end: { x: width - margin, y: y + 5 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      })
      y -= 15
    }
  }

  // Draw total line after all rows
  if (reportData.length > 0) {
    // Draw separator line
    y -= 5
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: width - margin, y: y + 5 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    y -= 15

    // Total row
    page.drawText('Total', { x: margin + col1, y, size: 10, font: boldFont })
    page.drawText(`Students: ${reportData.length}`, { x: margin + col2, y, size: 10, font: boldFont })
    // Total amount (only if status is 'paid' or 'all' – for 'unpaid' it will be 0)
    const totalDisplay = totalAmount > 0 ? `Rs.${totalAmount}` : '-'
    page.drawText(totalDisplay, { x: margin + col4, y, size: 10, font: boldFont })
  } else {
    // No data – show a message
    y -= 15
    page.drawText('No records found for the selected filters.', {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Report_${formattedFromDate}-${formattedToDate}.pdf"`
    },
  })
}