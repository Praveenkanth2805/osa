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

  const isAdmin = session.user.role === 'ADMIN'
  const userDepartmentId = session.user.departmentId

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet)

  const errors: string[] = []
  const students: any[] = []

  // Fetch existing data for validation
  const departments = await prisma.department.findMany()
  const courses = await prisma.course.findMany()
  const academicYears = await prisma.academicYear.findMany()

  const departmentMap = new Map(departments.map(d => [String(d.code).trim(), d.id]))
  const courseMap = new Map(courses.map(c => [String(c.code).trim(), c.id]))
  
  // Academic year mapping
  const yearByStartEnd = new Map<string, string>()
  const yearByNormalized = new Map<string, string>()
  for (const y of academicYears) {
    const key = `${y.startYear}-${y.endYear}`
    yearByStartEnd.set(key, y.id)
    yearByNormalized.set(y.year.trim(), y.id)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const registerNumber = String(row['Register Number'] || row['registerNumber'] || '').trim()
    const name = row['Name'] || row['name']
    const gender = (row['Gender'] || row['gender'] || 'MALE').toUpperCase()
    const departmentCode = isAdmin ? (row['Department Code'] || row['departmentCode']) : null
    const courseCode = row['Course Code'] || row['courseCode']
    const academicYearStr = (row['Academic Year'] || row['academicYear'] || '').toString().trim()

    // Validate required fields


    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      errors.push(`Row ${i + 2}: Invalid gender (${gender}). Use MALE/FEMALE/OTHER`)
      continue
    }

    // Department resolution
    let departmentId: string | undefined
    if (!isAdmin) {
      if (!userDepartmentId) {
        errors.push(`Row ${i + 2}: Department user has no assigned department`)
        continue
      }
      departmentId = userDepartmentId
    } else {
      if (!departmentCode) {
        errors.push(`Row ${i + 2}: Department Code required for admin import`)
        continue
      }
      departmentId = departmentMap.get(String(departmentCode).trim())
      if (!departmentId) {
        errors.push(`Row ${i + 2}: Invalid Department Code (${departmentCode})`)
        continue
      }
    }

    // Validate course
    if (!courseCode) {
      errors.push(`Row ${i + 2}: Course Code is required`)
      continue
    }
    const courseId = courseMap.get(String(courseCode).trim())
    if (!courseId) {
      errors.push(`Row ${i + 2}: Invalid Course Code (${courseCode})`)
      continue
    }
    const course = courses.find(c => c.id === courseId)
    if (!course) {
      errors.push(`Row ${i + 2}: Course not found (${courseCode})`)
      continue
    }
    if (course.departmentId !== departmentId) {
      errors.push(`Row ${i + 2}: Course ${courseCode} does not belong to the specified department`)
      continue
    }

    // Academic year resolution
    let academicYearId: string | null = null
    if (academicYearStr) {
      academicYearId = yearByNormalized.get(academicYearStr) ?? null
      if (!academicYearId) {
        const match = academicYearStr.match(/^(\d{4})-(\d{2,4})$/)
        if (match) {
          let startYear = parseInt(match[1], 10)
          let endYear = parseInt(match[2], 10)
          if (endYear < 100) endYear = startYear + (endYear - startYear % 100)
          const key = `${startYear}-${endYear}`
          academicYearId = yearByStartEnd.get(key) ?? null
        }
      }
      if (!academicYearId) {
        errors.push(`Row ${i + 2}: Invalid Academic Year (${academicYearStr})`)
        continue
      }
    } else {
      const currentYear = academicYears.find(y => y.isCurrent)
      if (currentYear) {
        academicYearId = currentYear.id
      } else {
        errors.push(`Row ${i + 2}: No Academic Year provided and no current year set`)
        continue
      }
    }

    // Duplicate check
    const existing = await prisma.student.findUnique({ where: { registerNumber } })
    if (existing) {
      errors.push(`Row ${i + 2}: Duplicate Register Number (${registerNumber})`)
      continue
    }

    students.push({
      registerNumber,
      name,
      gender,
      departmentId,
      courseId,
      academicYearId,
      isArchived: false,
    })
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors, imported: 0 }, { status: 400 })
  }

  console.log('====================')
  console.log('File Name:', file.name)
  console.log('Rows Count:', rows.length)
  console.log('First Row:', rows[0])
  console.log('====================')

  try {
    await prisma.student.createMany({ data: students })
    return NextResponse.json({ imported: students.length, errors: [] })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: 'Database error while importing', details: error.message },
      { status: 500 }
    )
  }
}