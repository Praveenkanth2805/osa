import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import XLSX from 'sheetjs-style'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet)

  const errors: string[] = []
  const students: any[] = []

  // Fetch existing data for validation
  const departments = await prisma.department.findMany()
  const courses = await prisma.course.findMany()
  const academicYears = await prisma.academicYear.findMany()

  const departmentMap = new Map(departments.map(d => [d.code, d.id]))
  const courseMap = new Map(courses.map(c => [c.code, c.id]))
  const yearMap = new Map(academicYears.map(y => [y.year, y.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const registerNumber = row['Register Number'] || row['registerNumber']
    const name = row['Name'] || row['name']
    const gender = (row['Gender'] || row['gender'] || 'MALE').toUpperCase()
    const mobile = String(row['Mobile'] || row['mobile'] || '')
    const departmentCode = row['Department Code'] || row['departmentCode']
    const courseCode = row['Course Code'] || row['courseCode']
    const academicYearStr = row['Academic Year'] || row['academicYear'] || ''

    // Validate required fields
    if (!registerNumber || !name || !mobile) {
      errors.push(`Row ${i + 2}: Missing required fields (Register Number, Name, Mobile)`)
      continue
    }

    // Validate mobile
    if (!/^[0-9]{10}$/.test(mobile)) {
      errors.push(`Row ${i + 2}: Invalid mobile number (${mobile})`)
      continue
    }

    // Validate gender
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      errors.push(`Row ${i + 2}: Invalid gender (${gender}). Use MALE/FEMALE/OTHER`)
      continue
    }

    // Validate department
    const departmentId = departmentMap.get(departmentCode)
    if (!departmentId) {
      errors.push(`Row ${i + 2}: Invalid Department Code (${departmentCode})`)
      continue
    }

    // Validate course
    const courseId = courseMap.get(courseCode)
    if (!courseId) {
      errors.push(`Row ${i + 2}: Invalid Course Code (${courseCode})`)
      continue
    }

    // Verify course belongs to department
    const course = courses.find(c => c.id === courseId)
    if (course?.departmentId !== departmentId) {
      errors.push(`Row ${i + 2}: Course ${courseCode} does not belong to department ${departmentCode}`)
      continue
    }

    // Validate academic year
    let academicYearId = null
    if (academicYearStr) {
      academicYearId = yearMap.get(academicYearStr)
      if (!academicYearId) {
        errors.push(`Row ${i + 2}: Invalid Academic Year (${academicYearStr}). Use format like "2025-26"`)
        continue
      }
    } else {
      // If no academic year provided, use current academic year
      const currentYear = academicYears.find(y => y.isCurrent)
      if (currentYear) {
        academicYearId = currentYear.id
      } else {
        errors.push(`Row ${i + 2}: No Academic Year provided and no current year set`)
        continue
      }
    }

    // Check duplicate register number
    const existing = await prisma.student.findUnique({
      where: { registerNumber }
    })
    if (existing) {
      errors.push(`Row ${i + 2}: Duplicate Register Number (${registerNumber})`)
      continue
    }

    students.push({
      registerNumber,
      name,
      gender,
      mobile,
      departmentId,
      courseId,
      academicYearId,
      isArchived: false,
    })
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors, imported: 0 }, { status: 400 })
  }

  // Bulk insert students
  try {
    await prisma.student.createMany({
      data: students,
      skipDuplicates: true,
    })
    return NextResponse.json({ imported: students.length, errors: [] })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: 'Database error while importing', details: error.message },
      { status: 500 }
    )
  }
}