// Notes API - Updated for teacher assignment feature
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Fetch all notes (public)
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
        { topic: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [notes, total] = await Promise.all([
      db.note.findMany({
        where,
        include: {
          uploader: {
            select: { id: true, name: true },
          },
          teacher: {
            select: { id: true, name: true },
          },
          subject: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.note.count({ where }),
    ])

    return NextResponse.json({
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch notes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST - Create a new note (requires auth)
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
      topic,
      session,
      semester,
      fileUrl,
      thumbnailUrl,
      fileType,
      fileSize,
      subjectId,
      teacherId, // Optional: Admin can assign note to a specific teacher
    } = body

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Title and file are required' },
        { status: 400 }
      )
    }

    const note = await db.note.create({
      data: {
        title,
        description,
        topic,
        session,
        semester,
        fileUrl,
        thumbnailUrl,
        fileType: fileType || 'PDF',
        fileSize,
        subjectId,
        uploaderId: userId,
        teacherId: teacherId || null, // Set teacher if provided by admin
      },
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
