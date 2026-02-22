import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - 特定の商品取得
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const product = await (prisma as any).product.findUnique({
            where: { id },
        });
        if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

// PATCH /api/products/[id] - 商品更新
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 管理者チェック (本来は共通化すべきだが、既存のロジックに合わせる)
    const isAdmin = userId === 'cmluyaayl0002qlbmwdujkht4';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();
        const product = await (prisma as any).product.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                amazonUrl: body.amazonUrl,
                imageUrl: body.imageUrl,
                category: body.category,
                price: body.price,
                isFeatured: body.isFeatured,
                displayOrder: body.displayOrder,
            },
        });
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
