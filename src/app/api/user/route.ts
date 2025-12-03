import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Get user data
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        categories: true,
        expenses: {
          include: {
            category: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

// Reset user data (keeps account, clears categories and expenses)
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all expenses first (due to foreign key)
    await prisma.expense.deleteMany({
      where: { userId: session.user.id },
    });

    // Delete all categories
    await prisma.category.deleteMany({
      where: { userId: session.user.id },
    });

    // Reset user setup status
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isSetupComplete: false,
        monthlyIncome: 0,
      },
      include: {
        categories: true,
        expenses: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error resetting user:', error);
    return NextResponse.json({ error: 'Failed to reset user' }, { status: 500 });
  }
}
