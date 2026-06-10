export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'DEPARTMENT'
  departmentId?: string
  departmentName?: string
}

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  name: string
  code: string
  fee: number
  departmentId: string
  department?: Department
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  registerNumber: string
  name: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  mobile: string
  departmentId: string
  courseId: string
  academicYearId?: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  department?: Department
  course?: Course
  academicYear?: AcademicYear
  payments?: Payment[]
}

export interface AcademicYear {
  id: string
  year: string
  startYear: number
  endYear: number
  isCurrent: boolean
  createdAt: string
}

export interface Payment {
  id: string
  receiptNumber: string
  studentId: string
  academicYearId: string
  amount: number
  paymentDate: string
  status: 'PAID' | 'UNPAID'
  createdAt: string
  student?: Student
  academicYear?: AcademicYear
}

export interface DashboardStats {
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
  totalCollection: number
  departmentStats: Array<{
    departmentName: string
    total: number
    paid: number
    unpaid: number
    collection: number
  }>
  recentPayments: Array<Payment & { student: Student }>
  academicYearId?: string
  academicYear?: AcademicYear
}