import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Setup categories (initial setup)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categories, monthlyIncome } = await request.json();

    // Delete existing categories
    await prisma.category.deleteMany({
      where: { userId: session.user.id },
    });

    // Create new categories
    const createdCategories = await Promise.all(
      categories.map((cat: { name: string; limit: number; color: string }) =>
        prisma.category.create({
          data: {
            name: cat.name,
            limit: cat.limit,
            color: cat.color,
            userId: session.user.id,
          },
        })
      )
    );

    // Mark setup as complete and save monthly income
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isSetupComplete: true,
        monthlyIncome: monthlyIncome || 0,
      },
    });

    return NextResponse.json({ categories: createdCategories, monthlyIncome: monthlyIncome || 0 });
  } catch (error) {
    console.error('Error creating categories:', error);
    return NextResponse.json({ error: 'Failed to create categories' }, { status: 500 });
  }
}

// Update categories
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categories } = await request.json();

    // Get existing category IDs
    const existingCategories = await prisma.category.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const existingIds = new Set(existingCategories.map((c) => c.id));

    const updatedCategories = [];

    for (const cat of categories) {
      if (cat.id && existingIds.has(cat.id)) {
        // Update existing category
        const updated = await prisma.category.update({
          where: { id: cat.id },
          data: {
            name: cat.name,
            limit: cat.limit,
            color: cat.color,
          },
        });
        updatedCategories.push(updated);
        existingIds.delete(cat.id);
      } else {
        // Create new category
        const created = await prisma.category.create({
          data: {
            name: cat.name,
            limit: cat.limit,
            color: cat.color,
            userId: session.user.id,
          },
        });
        updatedCategories.push(created);
      }
    }

    // Delete categories that are no longer in the list
    if (existingIds.size > 0) {
      await prisma.category.deleteMany({
        where: {
          id: { in: Array.from(existingIds) },
        },
      });
    }

    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error('Error updating categories:', error);
    return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 });
  }
}
