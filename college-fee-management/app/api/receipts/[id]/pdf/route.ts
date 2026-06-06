import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

function embedSafeImage(pdfDoc: any, bytes: Buffer) {
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
  return isPng ? pdfDoc.embedPng(bytes) : pdfDoc.embedJpg(bytes)
}

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

  // Add Tamil Nadu Government Watermark (centered)
  const watermarkPath = path.join(process.cwd(), 'public/logos/tn-govt-logo.png')

if (fs.existsSync(watermarkPath)) {
  const watermarkBytes = fs.readFileSync(watermarkPath)

  const isPng =
    watermarkBytes[0] === 0x89 && watermarkBytes[1] === 0x50

  const watermarkImage = isPng
    ? await pdfDoc.embedPng(watermarkBytes)
    : await pdfDoc.embedJpg(watermarkBytes)

  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const wmWidth = 320
  const wmHeight =
    (watermarkImage.height / watermarkImage.width) * wmWidth

  page.drawImage(watermarkImage, {
    x: (pageWidth - wmWidth) / 2,
    y: (pageHeight - wmHeight) / 2,
    width: wmWidth,
    height: wmHeight,
    opacity: 0.06, // government challan style light watermark
  })
}

  // Professional margins (50 points from each edge)
  const margin = 50
  let y = page.getHeight() - margin

  // College Logo
  const logoPath = path.join(process.cwd(), 'public/logos/college-logo.png')

if (fs.existsSync(logoPath)) {
  const logoBytes = fs.readFileSync(logoPath)

  const logoImage = await embedSafeImage(pdfDoc, logoBytes)

  page.drawImage(logoImage, {
    x: margin,
    y: y - 30,
    width: 60,
    height: 60,
  })
}

  // Header Text
  page.drawText('Arignar Anna Government Arts College', { x: margin + 80, y, size: 16, font: boldFont })
  y -= 20
  page.drawText('Villupuram, Tamil Nadu', { x: margin + 80, y, size: 11, font })
  y -= 25
  page.drawText('FEE PAYMENT RECEIPT', { x: margin + 80, y, size: 13, font: boldFont })
  y -= 45

  // Receipt Details
  page.drawText(`Receipt No: ${payment.receiptNumber}`, { x: margin, y, size: 10, font })
  page.drawText(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, { x: margin + 250, y, size: 10, font })
  y -= 20
  page.drawText(`Academic Year: ${payment.academicYear.year}`, { x: margin, y, size: 10, font })
  y -= 35

  // Student Details
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
  y -= 35

  // Payment Table Header
  page.drawText('Payment Details', { x: margin, y, size: 12, font: boldFont })
  y -= 20
  page.drawText('Description', { x: margin, y, size: 10, font: boldFont })
  page.drawText('Amount (Rs.)', { x: margin + 350, y, size: 10, font: boldFont })
  y -= 15
  page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + 500, y: y + 5 }, thickness: 1, color: rgb(0, 0, 0) })
  y -= 20
  page.drawText(`Tuition Fee - ${payment.student.course?.name}`, { x: margin, y, size: 10, font })
  page.drawText(`${payment.amount}`, { x: margin + 350, y, size: 10, font })
  y -= 20
  page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + 500, y: y + 5 }, thickness: 1, color: rgb(0, 0, 0) })
  y -= 20
  page.drawText('Total', { x: margin, y, size: 10, font: boldFont })
  page.drawText(`${payment.amount}`, { x: margin + 350, y, size: 10, font: boldFont })
  y -= 40

  // QR Code
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
  page.drawText(`Amount in words: Rupees ${payment.amount} only`, { x: margin, y: margin + 50, size: 9, font })
  page.drawText('This is a computer generated receipt', { x: margin, y: margin + 35, size: 8, font })
  page.drawText('Authorized Signature', { x: margin + 450, y: margin + 35, size: 9, font })

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
    },
  })
}