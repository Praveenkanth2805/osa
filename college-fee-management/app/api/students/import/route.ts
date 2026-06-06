import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import XLSX from 'sheetjs-style'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

  const errors: string[] = []
  const students = []

  for (const row of rows) {
    const registerNumber = row['Register Number'] || row['registerNumber']
    const name = row['Name'] || row['name']
    const gender = row['Gender'] || row['gender']
    const mobile = String(row['Mobile'] || row['mobile'])
    const departmentCode = row['Department Code'] || row['departmentCode']
    const courseCode = row['Course Code'] || row['courseCode']

    if (!registerNumber || !name || !mobile) {
      errors.push(`Missing required fields for row: ${JSON.stringify(row)}`)
      continue
    }

    const department = await prisma.department.findUnique({ where: { code: departmentCode } })
    const course = await prisma.course.findUnique({ where: { code: courseCode } })

    if (!department || !course) {
      errors.push(`Invalid department or course code for ${registerNumber}`)
      continue
    }

    const existing = await prisma.student.findUnique({ where: { registerNumber } })
    if (existing) {
      errors.push(`Duplicate register number: ${registerNumber}`)
      continue
    }

    students.push({
      registerNumber,
      name,
      gender: gender?.toUpperCase() || 'MALE',
      mobile,
      departmentId: department.id,
      courseId: course.id,
    })
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors, imported: 0 }, { status: 400 })
  }

  await prisma.student.createMany({ data: students })
  return NextResponse.json({ imported: students.length, errors: [] })
}