import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Like a book
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const book = await db.book.findUnique({
      where: { id },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const updatedBook = await db.book.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    })

    return NextResponse.json({ 
      likeCount: updatedBook.likeCount,
      message: 'Liked successfully' 
    })
  } catch (error) {
    console.error('Like book error:', error)
    return NextResponse.json(
      { error: 'Failed to like book' },
      { status: 500 }
    )
  }
}
