import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    const { expenses, categories, startDate, endDate } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ API key not configured' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    // Prepare expense data for analysis
    const categoryMap = new Map(categories.map((c: { id: string; name: string; limit: number }) => [c.id, c]));

    const expenseSummary = expenses.map((e: { categoryId: string; amount: number; description: string; date: string }) => {
      const category = categoryMap.get(e.categoryId) as { name: string; limit: number } | undefined;
      return {
        category: category?.name || 'Unknown',
        amount: e.amount,
        description: e.description,
        date: e.date,
      };
    });

    // Group by category
    const categoryTotals: Record<string, number> = {};
    expenseSummary.forEach((e: { category: string; amount: number }) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    // Calculate budget status
    const budgetStatus = categories.map((c: { id: string; name: string; limit: number }) => {
      const spent = categoryTotals[c.name] || 0;
      return {
        category: c.name,
        limit: c.limit,
        spent,
        percentage: ((spent / c.limit) * 100).toFixed(1),
        status: spent > c.limit ? 'OVER BUDGET' : spent > c.limit * 0.8 ? 'WARNING' : 'OK',
      };
    });

    const totalSpent = Object.values(categoryTotals).reduce((a, b) => (a as number) + (b as number), 0);
    const totalBudget = categories.reduce((sum: number, c: { limit: number }) => sum + c.limit, 0);

    const prompt = `You are a personal finance advisor analyzing expense data. Be concise and actionable.

EXPENSE DATA (${startDate} to ${endDate}):
- Total Spent: ¥${totalSpent?.toLocaleString()}
- Total Budget: ¥${totalBudget.toLocaleString()}

CATEGORY BREAKDOWN:
${budgetStatus.map((b: { category: string; spent: number; limit: number; percentage: string; status: string }) =>
  `- ${b.category}: ¥${b.spent.toLocaleString()} / ¥${b.limit.toLocaleString()} (${b.percentage}%) [${b.status}]`
).join('\n')}

RECENT TRANSACTIONS:
${expenseSummary.slice(0, 20).map((e: { date: string; category: string; amount: number; description: string }) =>
  `- ${e.date}: ${e.category} - ¥${e.amount.toLocaleString()}${e.description ? ` (${e.description})` : ''}`
).join('\n')}

Please provide a brief analysis (max 200 words) covering:
1. Where is most money being spent?
2. Which categories are over budget or at risk?
3. One specific, actionable tip to save money

Use ¥ for currency. Be direct and helpful.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const analysis = completion.choices[0]?.message?.content || 'Unable to generate analysis';

    return NextResponse.json({
      analysis,
      summary: {
        totalSpent,
        totalBudget,
        categoryTotals,
        budgetStatus,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze expenses' },
      { status: 500 }
    );
  }
}
