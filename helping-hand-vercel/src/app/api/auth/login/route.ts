import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword
}

// Auto-seed admin if no users exist
async function ensureAdminExists() {
  const adminCount = await db.user.count({
    where: { role: 'ADMIN' }
  })
  
  if (adminCount === 0) {
    // Create default admin
    const hashedPassword = hashPassword('admin123')
    await db.user.create({
      data: {
        email: 'admin@ice.edu',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      },
    })
    
    // Create sample social links if they don't exist
    const socialCount = await db.socialLink.count()
    if (socialCount === 0) {
      await db.socialLink.createMany({
        data: [
          { platform: 'Facebook', url: 'https://facebook.com/icedept', icon: 'facebook', order: 1 },
          { platform: 'YouTube', url: 'https://youtube.com/@icedept', icon: 'youtube', order: 2 },
          { platform: 'Website', url: 'https://ice.edu', icon: 'globe', order: 3 },
        ],
      })
    }
    
    // Create default settings if they don't exist
    const settingsCount = await db.siteSetting.count()
    if (settingsCount === 0) {
      await db.siteSetting.createMany({
        data: [
          { key: 'siteName', value: 'Helping Hand', description: 'Site name' },
          { key: 'siteDescription', value: 'ICE Department Ebook & Notes Management System', description: 'Site description' },
          { key: 'bkashNumber', value: '01521706294', description: 'Bkash number for donations' },
          { key: 'departmentName', value: 'ICE Department', description: 'Department name' },
        ],
      })
    }
    
    return true
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Auto-seed if no admin exists
    await ensureAdminExists()
    
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid email or password. Default admin: admin@ice.edu / admin123' },
        { status: 401 }
      )
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
