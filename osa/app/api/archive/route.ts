import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, studentIds, academicYearId, departmentId } = await req.json()
  
  let where: any = {}
  if (studentIds && studentIds.length) where.id = { in: studentIds }
  if (academicYearId) {
    const payments = await prisma.payment.findMany({
      where: { academicYearId },
      select: { studentId: true },
    })
    where.id = { in: payments.map(p => p.studentId) }
  }
  if (departmentId) where.departmentId = departmentId

  const archived = action === 'archive'
  await prisma.student.updateMany({
    where,
    data: { isArchived: archived },
  })

  return NextResponse.json({ success: true, message: `${action === 'archive' ? 'Archived' : 'Restored'} successfully` })
}