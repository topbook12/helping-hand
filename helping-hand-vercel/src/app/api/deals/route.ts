import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Fetch all deals (public)
export async function GET(request: NextRequest) {
  try {
    const deals = await db.studentDeal.findMany({
      where: { 
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ deals })
  } catch (error) {
    console.error('Fetch deals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

// POST - Create a new deal (admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('auth-token')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      imageUrl,
      affiliateUrl,
      originalPrice,
      dealPrice,
      discount,
      category,
      expiresAt,
    } = body

    if (!title || !affiliateUrl) {
      return NextResponse.json(
        { error: 'Title and affiliate URL are required' },
        { status: 400 }
      )
    }

    const deal = await db.studentDeal.create({
      data: {
        title,
        description,
        imageUrl,
        affiliateUrl,
        originalPrice,
        dealPrice,
        discount,
        category,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Create deal error:', error)
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}
