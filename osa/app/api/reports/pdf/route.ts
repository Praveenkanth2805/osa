import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateReportPdf } from '@/lib/reportPdf'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fromDate = searchParams.get('fromDate')
  const toDate = searchParams.get('toDate')
  const status = searchParams.get('status') || 'all'

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'From and To dates required' }, { status: 400 })
  }

  const pdfBuffer = await generateReportPdf(
    fromDate,
    toDate,
    status,
    session.user.role !== 'ADMIN' ? session.user.departmentId : undefined
  )

  if (!pdfBuffer) {
    return NextResponse.json({ error: 'No records found' }, { status: 404 })
  }

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${day}-${month}-${year}`
  }

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Report_${formatDate(fromDate)}-${formatDate(toDate)}.pdf"`,
    },
  })
}