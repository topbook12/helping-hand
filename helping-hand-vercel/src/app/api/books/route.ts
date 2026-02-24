import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Fetch all books (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session = searchParams.get('session')
    const semester = searchParams.get('semester')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const where: Record<string, unknown> = { isActive: true }

    if (session && session !== 'all') {
      where.session = session
    }
    if (semester && semester !== 'all') {
      where.semester = semester
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { writerName: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [books, total] = await Promise.all([
      db.book.findMany({
        where,
        include: {
          uploader: {
            select: { id: true, name: true },
          },
          subject: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.book.count({ where }),
    ])

    return NextResponse.json({
      books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch books error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

// POST - Create a new book (requires auth)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('auth-token')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      writerName,
      publisher,
      year,
      session,
      semester,
      fileUrl,
      thumbnailUrl,
      fileSize,
      subjectId,
    } = body

    if (!title || !writerName || !fileUrl) {
      return NextResponse.json(
        { error: 'Title, writer name, and file are required' },
        { status: 400 }
      )
    }

    const book = await db.book.create({
      data: {
        title,
        description,
        writerName,
        publisher,
        year,
        session,
        semester,
        fileUrl,
        thumbnailUrl,
        fileSize,
        subjectId,
        uploaderId: userId,
      },
    })

    return NextResponse.json({ book })
  } catch (error) {
    console.error('Create book error:', error)
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    )
  }
}
