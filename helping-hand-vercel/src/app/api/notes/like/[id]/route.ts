import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const note = await db.note.findUnique({
      where: { id },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updatedNote = await db.note.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    })

    return NextResponse.json({ 
      likeCount: updatedNote.likeCount,
      message: 'Liked successfully' 
    })
  } catch (error) {
    console.error('Like note error:', error)
    return NextResponse.json(
      { error: 'Failed to like note' },
      { status: 500 }
    )
  }
}
