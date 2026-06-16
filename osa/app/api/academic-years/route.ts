import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const years = await prisma.academicYear.findMany({ orderBy: { startYear: 'desc' } })
  return NextResponse.json(years)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { year, startYear, endYear, isCurrent } = await req.json()

  if (isCurrent) {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } })
  }

  const newYear = await prisma.academicYear.create({
    data: { year, startYear, endYear, isCurrent: isCurrent || false },
  })
  return NextResponse.json(newYear, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { year, startYear, endYear, isCurrent } = await req.json()

  if (isCurrent) {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } })
  }

  const updated = await prisma.academicYear.update({
    where: { id },
    data: { year, startYear, endYear, isCurrent: isCurrent || false },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.academicYear.delete({ where: { id } })
  return NextResponse.json({ success: true })
}