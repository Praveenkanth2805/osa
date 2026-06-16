import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// GET – fetch all department users (admin only)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { role: 'DEPARTMENT' },
    include: { department: true },
  })

  // Transform to include department name
  const transformed = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    departmentId: u.departmentId,
    departmentName: u.department?.name,
  }))
  return NextResponse.json(transformed)
}

// POST – create new department user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, password, name, departmentId } = await req.json()
  if (!email || !password || !name || !departmentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'DEPARTMENT',
      departmentId,
    },
    include: { department: true },
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.departmentId,
    departmentName: user.department?.name,
  }, { status: 201 })
}

// PUT – update department user
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { email, password, name, departmentId } = await req.json()
  if (!email || !name || !departmentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if email already taken by another user
  const existingEmail = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  })
  if (existingEmail) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  }

  const updateData: any = { email, name, departmentId }
  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { department: true },
  })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.departmentId,
    departmentName: user.department?.name,
  })
}

// DELETE – remove department user
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}