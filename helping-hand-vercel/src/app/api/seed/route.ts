import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Seed initial data (only if no admin exists)
export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin already exists',
        credentials: {
          email: 'Use existing admin account',
          password: '******',
        }
      })
    }

    // Create default admin
    const hashedPassword = Buffer.from('admin123').toString('base64')
    const admin = await db.user.create({
      data: {
        email: 'admin@ice.edu',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      },
    })

    // Create sample social links
    await db.socialLink.createMany({
      data: [
        { platform: 'Facebook', url: 'https://facebook.com/icedept', icon: 'facebook', order: 1 },
        { platform: 'YouTube', url: 'https://youtube.com/@icedept', icon: 'youtube', order: 2 },
        { platform: 'Website', url: 'https://ice.edu', icon: 'globe', order: 3 },
      ],
    })

    // Create default settings
    await db.siteSetting.createMany({
      data: [
        { key: 'siteName', value: 'Helping Hand', description: 'Site name' },
        { key: 'siteDescription', value: 'ICE Department Ebook & Notes Management System', description: 'Site description' },
        { key: 'bkashNumber', value: '01521706294', description: 'Bkash number for donations' },
        { key: 'departmentName', value: 'ICE Department', description: 'Department name' },
      ],
    })

    return NextResponse.json({ 
      message: 'Database seeded successfully',
      credentials: {
        email: admin.email,
        password: 'admin123',
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
