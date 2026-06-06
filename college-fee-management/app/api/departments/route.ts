import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const departments = await prisma.department.findMany({
    include: { courses: true, students: { take: 1 } },
  })
  return NextResponse.json(departments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, code, description } = await req.json()
  const department = await prisma.department.create({
    data: { name, code, description },
  })
  return NextResponse.json(department, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { name, code, description } = await req.json()
  const department = await prisma.department.update({
    where: { id },
    data: { name, code, description },
  })
  return NextResponse.json(department)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.department.delete({ where: { id } })
  return NextResponse.json({ success: true })
}