import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const academicYearId = searchParams.get('academicYearId')
  const receiptNumber = searchParams.get('receiptNumber')

  const where: any = {}
  if (studentId) where.studentId = studentId
  if (academicYearId) where.academicYearId = academicYearId
  if (receiptNumber) where.receiptNumber = { contains: receiptNumber }
  if (session.user.role !== 'ADMIN') {
    where.student = { departmentId: session.user.departmentId }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: { student: { include: { department: true, course: true } }, academicYear: true },
    orderBy: { paymentDate: 'desc' },
  })
  return NextResponse.json(payments)
}