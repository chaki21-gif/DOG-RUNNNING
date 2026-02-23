import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/diary/[id] - 日記エントリを編集
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entry = await prisma.dogDiary.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (entry.ownerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { body, date, imageUrl } = await req.json();
    if (!body) return NextResponse.json({ error: 'Body is required' }, { status: 400 });

    const updated = await prisma.dogDiary.update({
        where: { id },
        data: {
            body,
            date: date || entry.date,
            imageUrl: imageUrl ?? entry.imageUrl,
        },
    });

    return NextResponse.json(updated);
}

// DELETE /api/diary/[id] - 日記エントリを削除
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entry = await prisma.dogDiary.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (entry.ownerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.dogDiary.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
