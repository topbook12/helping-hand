import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Fetch single book
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const book = await db.book.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, name: true },
        },
        subject: true,
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Increment view count
    await db.book.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ book })
  } catch (error) {
    console.error('Fetch book error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

// PUT - Update book
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('auth-token')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingBook = await db.book.findUnique({ where: { id } })
    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Only admin or the uploader can edit
    if (user.role !== 'ADMIN' && existingBook.uploaderId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const book = await db.book.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ book })
  } catch (error) {
    console.error('Update book error:', error)
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    )
  }
}

// DELETE - Delete book
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const userId = cookieStore.get('auth-token')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingBook = await db.book.findUnique({ where: { id } })
    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Only admin or the uploader can delete
    if (user.role !== 'ADMIN' && existingBook.uploaderId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await db.book.delete({ where: { id } })

    return NextResponse.json({ message: 'Book deleted successfully' })
  } catch (error) {
    console.error('Delete book error:', error)
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    )
  }
}
