import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Download book and increment count
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const book = await db.book.findUnique({
      where: { id },
      select: { id: true, fileUrl: true, title: true },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Increment download count
    await db.book.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    })

    return NextResponse.json({ 
      downloadUrl: book.fileUrl,
      title: book.title 
    })
  } catch (error) {
    console.error('Download book error:', error)
    return NextResponse.json(
      { error: 'Failed to download book' },
      { status: 500 }
    )
  }
}
