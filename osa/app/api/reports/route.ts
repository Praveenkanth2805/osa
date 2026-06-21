import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  // Determine department filter
  const whereStudent: any = { isArchived: false }
  if (session.user.role !== 'ADMIN') {
    whereStudent.departmentId = session.user.departmentId
  }

  // Fetch all students (filtered by department)
  const students = await prisma.student.findMany({
    where: whereStudent,
    include: { department: true },
  })

  // Fetch payments in date range for these students
  const studentIds = students.map(s => s.id)
  const payments = await prisma.payment.findMany({
    where: {
      studentId: { in: studentIds },
      paymentDate: { gte: from, lte: to },
    },
    select: { studentId: true },
  })

  const paidStudentIds = new Set(payments.map(p => p.studentId))

  // Build report data
  let reportData = students.map(student => ({
    student,
    hasPayment: paidStudentIds.has(student.id),
  }))

  // Apply status filter
  if (status === 'paid') {
    reportData = reportData.filter(d => d.hasPayment)
  } else if (status === 'unpaid') {
    reportData = reportData.filter(d => !d.hasPayment)
  }

  return NextResponse.json(reportData)
}