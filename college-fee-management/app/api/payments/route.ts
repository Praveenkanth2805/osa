import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReceiptNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const academicYearId = searchParams.get('academicYearId')

  const where: any = {}
  if (studentId) where.studentId = studentId
  if (academicYearId) where.academicYearId = academicYearId
  if (session.user.role !== 'ADMIN') {
    where.student = { departmentId: session.user.departmentId }
  }

  try {
    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          include: { department: true, course: true }
        },
        academicYear: true
      },
      orderBy: { paymentDate: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { studentId, academicYearId } = await req.json()

    // Check if already paid
    const existing = await prisma.payment.findFirst({
      where: { studentId, academicYearId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Payment already exists for this academic year' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { course: true },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    })
    if (!academicYear) return NextResponse.json({ error: 'Academic year not found' }, { status: 404 })

    // Get next receipt number sequence
    const lastPayment = await prisma.payment.findFirst({
  orderBy: { receiptNumber: 'desc' },
})
let sequence = 1
if (lastPayment) {
  const seqNum = parseInt(lastPayment.receiptNumber, 10)
  if (!isNaN(seqNum)) sequence = seqNum + 1
}
const receiptNumber = generateReceiptNumber(sequence)

    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        studentId,
        academicYearId,
        amount: student.course.fee,
        status: 'PAID',
      },
      include: {
        student: { include: { department: true, course: true } },
        academicYear: true
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 })
  }
}