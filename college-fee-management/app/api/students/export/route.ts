import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import XLSX from 'sheetjs-style'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('departmentId')
  const where: any = { isArchived: false }
  if (session.user.role !== 'ADMIN') where.departmentId = session.user.departmentId
  else if (departmentId) where.departmentId = departmentId

  const students = await prisma.student.findMany({ where, include: { department: true, course: true } })
  const worksheetData = students.map(s => ({ 'Register Number': s.registerNumber, 'Name': s.name, 'Gender': s.gender, 'Mobile': s.mobile, 'Department': s.department?.name, 'Course': s.course?.name, 'Fee Amount': s.course?.fee }))
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, { headers: { 'Content-Disposition': 'attachment; filename="students.xlsx"', 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } })
}