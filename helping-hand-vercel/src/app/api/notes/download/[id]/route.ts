import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const note = await db.note.findUnique({
      where: { id },
      select: { id: true, fileUrl: true, title: true },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await db.note.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    })

    return NextResponse.json({ 
      downloadUrl: note.fileUrl,
      title: note.title 
    })
  } catch (error) {
    console.error('Download note error:', error)
    return NextResponse.json(
      { error: 'Failed to download note' },
      { status: 500 }
    )
  }
}
