import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('departmentId')
  
  const where = departmentId ? { departmentId } : {}
  const courses = await prisma.course.findMany({
    where,
    include: { department: true },
  })
  return NextResponse.json(courses)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { name, code, fee, departmentId } = await req.json()

    const course = await prisma.course.create({
      data: { name, code, fee, departmentId },
      include: { department: true },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { name, code, fee, departmentId } = await req.json()
  const course = await prisma.course.update({
    where: { id },
    data: { name, code, fee, departmentId },
  })
  return NextResponse.json(course)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.course.delete({ where: { id } })
  return NextResponse.json({ success: true })
}