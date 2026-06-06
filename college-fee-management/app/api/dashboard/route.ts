import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.role === 'ADMIN'
  const departmentId = session.user.departmentId

  try {
    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true }
    })

    if (!currentYear) {
      return NextResponse.json({ error: 'No academic year set' }, { status: 400 })
    }

    // Base student query
    const studentWhere = {
      isArchived: false,
      ...(isAdmin ? {} : { departmentId })
    }

    const totalStudents = await prisma.student.count({ where: studentWhere })

    // Paid students count (have payment for current year)
    const paidStudents = await prisma.payment.groupBy({
      by: ['studentId'],
      where: {
        academicYearId: currentYear.id,
        student: studentWhere
      }
    })

    const unpaidStudents = totalStudents - paidStudents.length

    // Total collection
    const totalCollection = await prisma.payment.aggregate({
      where: {
        academicYearId: currentYear.id,
        student: studentWhere
      },
      _sum: { amount: true }
    })

    // Department-wise stats
    const departments = await prisma.department.findMany({
      where: isAdmin ? {} : { id: departmentId },
      include: {
        students: {
          where: { isArchived: false }
        }
      }
    })

    const departmentStats = await Promise.all(departments.map(async (dept) => {
      const deptStudents = await prisma.student.findMany({
        where: {
          departmentId: dept.id,
          isArchived: false
        },
        select: { id: true }
      })

      const paid = await prisma.payment.count({
        where: {
          academicYearId: currentYear.id,
          studentId: { in: deptStudents.map(s => s.id) }
        }
      })

      const collection = await prisma.payment.aggregate({
        where: {
          academicYearId: currentYear.id,
          studentId: { in: deptStudents.map(s => s.id) }
        },
        _sum: { amount: true }
      })

      return {
        departmentName: dept.name,
        total: deptStudents.length,
        paid,
        unpaid: deptStudents.length - paid,
        collection: collection._sum.amount || 0
      }
    }))

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        student: studentWhere
      },
      include: {
        student: {
          include: {
            department: true,
            course: true
          }
        },
        academicYear: true
      },
      orderBy: { paymentDate: 'desc' },
      take: 10
    })

    return NextResponse.json({
      totalStudents,
      paidStudents: paidStudents.length,
      unpaidStudents,
      totalCollection: totalCollection._sum.amount || 0,
      departmentStats,
      recentPayments
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}