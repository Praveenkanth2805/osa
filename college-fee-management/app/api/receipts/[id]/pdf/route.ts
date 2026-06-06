import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      student: { include: { department: true, course: true } },
      academicYear: true,
    },
  })

  if (!payment) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
  }

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Add Tamil Nadu Government watermark (centered, low opacity)
  const watermarkPath = path.join(process.cwd(), 'public/logos/tn-govt-logo.png')
  if (fs.existsSync(watermarkPath)) {
    const watermarkImage = await pdfDoc.embedPng(fs.readFileSync(watermarkPath))
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()
    const imgWidth = 200
    const imgHeight = (watermarkImage.height / watermarkImage.width) * imgWidth
    page.drawImage(watermarkImage, {
      x: (pageWidth - imgWidth) / 2,
      y: (pageHeight - imgHeight) / 2,
      width: imgWidth,
      height: imgHeight,
      opacity: 0.1,
    })
  }

  let y = 750
  const margin = 50

  // College Logo (left side)
  const logoPath = path.join(process.cwd(), 'public/logos/college-logo.png')
  if (fs.existsSync(logoPath)) {
    const logoImage = await pdfDoc.embedPng(fs.readFileSync(logoPath))
    page.drawImage(logoImage, { x: margin, y: y - 30, width: 60, height: 60 })
  }

  // Header text
  page.drawText('Arignar Anna Government Arts College', { x: margin + 80, y, size: 16, font: boldFont })
  y -= 20
  page.drawText('Villupuram, Tamil Nadu', { x: margin + 80, y, size: 11, font })
  y -= 25
  page.drawText('FEE PAYMENT RECEIPT', { x: margin + 80, y, size: 13, font: boldFont })
  y -= 40

  // Receipt details
  page.drawText(`Receipt No: ${payment.receiptNumber}`, { x: margin, y, size: 10, font })
  page.drawText(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, { x: margin + 250, y, size: 10, font })
  y -= 20
  page.drawText(`Academic Year: ${payment.academicYear.year}`, { x: margin, y, size: 10, font })
  y -= 30

  // Student details
  page.drawText('Student Details', { x: margin, y, size: 12, font: boldFont })
  y -= 20
  page.drawText(`Register No: ${payment.student.registerNumber}`, { x: margin, y, size: 10, font })
  page.drawText(`Name: ${payment.student.name}`, { x: margin + 250, y, size: 10, font })
  y -= 18
  page.drawText(`Gender: ${payment.student.gender}`, { x: margin, y, size: 10, font })
  page.drawText(`Mobile: ${payment.student.mobile}`, { x: margin + 250, y, size: 10, font })
  y -= 18
  page.drawText(`Department: ${payment.student.department?.name}`, { x: margin, y, size: 10, font })
  page.drawText(`Course: ${payment.student.course?.name}`, { x: margin + 250, y, size: 10, font })
  y -= 30

  // Payment table
  page.drawText('Payment Details', { x: margin, y, size: 12, font: boldFont })
  y -= 20
  page.drawText('Description', { x: margin, y, size: 10, font: boldFont })
  page.drawText('Amount (Rs)', { x: margin + 350, y, size: 10, font: boldFont })
  y -= 15
  page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + 500, y: y + 5 }, thickness: 1, color: rgb(0, 0, 0) })
  y -= 15
  page.drawText(`Tuition Fee - ${payment.student.course?.name}`, { x: margin, y, size: 10, font })
  page.drawText(`${payment.amount}`, { x: margin + 350, y, size: 10, font })
  y -= 15
  page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + 500, y: y + 5 }, thickness: 1, color: rgb(0, 0, 0) })
  y -= 15
  page.drawText('Total', { x: margin, y, size: 10, font: boldFont })
  page.drawText(`₹${payment.amount}`, { x: margin + 350, y, size: 10, font: boldFont })
  y -= 30

  // QR Code with detailed data
  const qrData = JSON.stringify({
    receiptNo: payment.receiptNumber,
    studentName: payment.student.name,
    regNo: payment.student.registerNumber,
    amount: payment.amount,
    date: new Date(payment.paymentDate).toLocaleDateString(),
    academicYear: payment.academicYear.year,
  })
  const qrImage = await QRCode.toBuffer(qrData, { width: 100, margin: 1 })
  const qrImageEmbed = await pdfDoc.embedPng(qrImage)
  page.drawImage(qrImageEmbed, { x: margin + 450, y: y - 80, width: 80, height: 80 })

  // Footer
  page.drawText(`Amount in words: Rupees ${payment.amount} only`, { x: margin, y: 80, size: 9, font })
  page.drawText('This is a computer generated receipt', { x: margin, y: 60, size: 8, font })
  page.drawText('Authorized Signature', { x: margin + 450, y: 60, size: 9, font })

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
    },
  })
}