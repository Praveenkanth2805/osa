import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { student: { include: { department: true, course: true } }, academicYear: true },
  })
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(payment)
}