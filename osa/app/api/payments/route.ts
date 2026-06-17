import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const academicYearId = searchParams.get('academicYearId')
  const fromDate = searchParams.get('fromDate')
  const toDate = searchParams.get('toDate')

  const where: any = {}
  if (studentId) where.studentId = studentId
  if (academicYearId) where.academicYearId = academicYearId
  if (session.user.role !== 'ADMIN') {
    where.student = { departmentId: session.user.departmentId }
  }

  // Date filters – apply before query
  if (fromDate) {
    where.paymentDate = { gte: new Date(fromDate) }
  }
  if (toDate) {
    const endDate = new Date(toDate)
    endDate.setHours(23, 59, 59, 999)
    where.paymentDate = { ...where.paymentDate, lte: endDate }
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

  // Allow ADMIN, DEPARTMENT, and OFFICE_USER to create payments
  const allowedRoles = ['ADMIN', 'DEPARTMENT', 'OFFICE_USER']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { studentId, academicYearId, paymentDate } = await req.json()

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

    // Generate receipt number: endYear-XXXXX
    const receiptYear = academicYear.endYear
    const lastPayment = await prisma.payment.findFirst({
      where: { receiptNumber: { startsWith: `${receiptYear}-` } },
      orderBy: { receiptNumber: 'desc' },
    })
    let sequence = 1
    if (lastPayment) {
      const seqPart = lastPayment.receiptNumber.split('-')[1]
      sequence = parseInt(seqPart, 10) + 1
    }
    const receiptNumber = `${receiptYear}-${String(sequence).padStart(5, '0')}`

    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        studentId,
        academicYearId,
        amount: student.course.fee,
        status: 'PAID',
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
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

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
  }

  const { password } = await req.json()
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  // Verify admin password
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  if (!adminUser || !bcrypt.compareSync(password, adminUser.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  await prisma.payment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}