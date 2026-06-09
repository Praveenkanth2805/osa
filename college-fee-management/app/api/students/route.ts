import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateMobile } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('departmentId')
  const isArchived = searchParams.get('isArchived') === 'true'
  const academicYearId = searchParams.get('academicYearId')
 

  const where: any = { isArchived }

   if (academicYearId) {
    where.academicYearId = academicYearId
  }
  
  if (session.user.role !== 'ADMIN') {
    where.departmentId = session.user.departmentId
  } else if (departmentId) {
    where.departmentId = departmentId
  }

  const students = await prisma.student.findMany({
    where,
    include: { 
      department: true, 
      course: true, 
      academicYear: true 
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  let { registerNumber, name, gender, mobile, departmentId, courseId, academicYearId } = body

  // For department users, force departmentId to their own
  if (session.user.role !== 'ADMIN') {
    departmentId = session.user.departmentId
    if (!departmentId) {
      return NextResponse.json({ error: 'Department user has no assigned department' }, { status: 403 })
    }
  }

  if (!registerNumber || !name || !mobile || !departmentId || !courseId || !academicYearId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!validateMobile(mobile)) {
    return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 })
  }

  const existing = await prisma.student.findUnique({
    where: { registerNumber },
  })
  if (existing) {
    return NextResponse.json({ error: 'Register number already exists' }, { status: 400 })
  }

  // Validate academic year exists
  const yearExists = await prisma.academicYear.findUnique({ where: { id: academicYearId } })
  if (!yearExists) {
    return NextResponse.json({ error: 'Invalid academic year' }, { status: 400 })
  }

  const student = await prisma.student.create({
    data: {
      registerNumber,
      name,
      gender,
      mobile,
      departmentId,
      courseId,
      academicYearId,
    },
    include: { department: true, course: true, academicYear: true },
  })
  return NextResponse.json(student, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const body = await req.json()
  let { registerNumber, name, gender, mobile, departmentId, courseId, academicYearId } = body

  // For department users, force departmentId to their own
  if (session.user.role !== 'ADMIN') {
    departmentId = session.user.departmentId
    if (!departmentId) {
      return NextResponse.json({ error: 'Department user has no assigned department' }, { status: 403 })
    }
  } else {
    // For admin, departmentId is required
    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID required' }, { status: 400 })
    }
  }

  if (!registerNumber || !name || !mobile || !courseId || !academicYearId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (mobile && !validateMobile(mobile)) {
    return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 })
  }

  // Validate academic year if provided
  if (academicYearId) {
    const yearExists = await prisma.academicYear.findUnique({ where: { id: academicYearId } })
    if (!yearExists) {
      return NextResponse.json({ error: 'Invalid academic year' }, { status: 400 })
    }
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      registerNumber,
      name,
      gender,
      mobile,
      departmentId,
      courseId,
      academicYearId: academicYearId || null,
    },
    include: { department: true, course: true, academicYear: true },
  })
  return NextResponse.json(student)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
  return NextResponse.json(
    { error: 'Only admin can delete students' },
    { status: 403 }
  )
}

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.student.delete({ where: { id } })
  return NextResponse.json({ success: true })
}