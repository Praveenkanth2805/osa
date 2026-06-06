import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  })

  // Create default academic year if none exists
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const yearString = `${currentYear}-${nextYear.toString().slice(-2)}`

  const existingYear = await prisma.academicYear.findFirst()
  if (!existingYear) {
    await prisma.academicYear.create({
      data: {
        year: yearString,
        startYear: currentYear,
        endYear: nextYear,
        isCurrent: true,
      },
    })
  }

  // Create sample department if none
  const deptCount = await prisma.department.count()
  if (deptCount === 0) {
    const dept = await prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        description: 'Department of Computer Science',
      },
    })
    await prisma.course.create({
      data: {
        name: 'B.Sc Computer Science',
        code: 'BSCS',
        fee: 25000,
        departmentId: dept.id,
      },
    })
  }

  console.log('Seed completed.')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())