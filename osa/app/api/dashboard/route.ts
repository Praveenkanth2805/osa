import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.role === 'ADMIN'
  const departmentId = session.user.departmentId

  // Get current academic year
  const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } })
  if (!currentYear) {
    return NextResponse.json({ error: 'No academic year set' }, { status: 400 })
  }

  // Base where clause for students in current academic year
  const studentWhere: any = {
    academicYearId: currentYear.id,
    isArchived: false,
  }
  if (!isAdmin) studentWhere.departmentId = departmentId

  // Total students in current academic year
  const totalStudents = await prisma.student.count({ where: studentWhere })

  // Paid students (have payment for current year)
  const paidStudents = await prisma.payment.count({
    where: {
      academicYearId: currentYear.id,
      student: studentWhere,
    },
  })

  const unpaidStudents = totalStudents - paidStudents

  // Total collection for current year
  const totalCollection = await prisma.payment.aggregate({
    where: {
      academicYearId: currentYear.id,
      student: studentWhere,
    },
    _sum: { amount: true },
  })

  // Department-wise stats (only for current academic year)
  let departmentStats = []
  const departments = await prisma.department.findMany({
    where: isAdmin ? {} : { id: departmentId },
  })

  for (const dept of departments) {
    const deptStudents = await prisma.student.findMany({
      where: {
        departmentId: dept.id,
        academicYearId: currentYear.id,
        isArchived: false,
      },
      select: { id: true },
    })
    const studentIds = deptStudents.map(s => s.id)
    const paid = await prisma.payment.count({
      where: {
        academicYearId: currentYear.id,
        studentId: { in: studentIds },
      },
    })
    const collection = await prisma.payment.aggregate({
      where: {
        academicYearId: currentYear.id,
        studentId: { in: studentIds },
      },
      _sum: { amount: true },
    })
    departmentStats.push({
      departmentName: dept.name,
      total: deptStudents.length,
      paid,
      unpaid: deptStudents.length - paid,
      collection: collection._sum.amount || 0,
    })
  }

  // Recent payments (only current year)
  const recentPayments = await prisma.payment.findMany({
    where: {
      academicYearId: currentYear.id,
      student: studentWhere,
    },
    include: {
      student: { include: { department: true, course: true } },
      academicYear: true,
    },
    orderBy: { paymentDate: 'desc' },
    take: 10,
  })

  const today = new Date()
today.setHours(0, 0, 0, 0)
const todayPayments = await prisma.payment.count({
  where: {
    paymentDate: { gte: today },
    student: studentWhere,
  },
})

  return NextResponse.json({
    totalStudents,
    paidStudents,
    unpaidStudents,
    totalCollection: totalCollection._sum.amount || 0,
    departmentStats,
    recentPayments,
    todayPayments,
  })
}