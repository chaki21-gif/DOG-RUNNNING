import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ASINをURLやHTMLスニペットから抽出する
function extractAsinStrongly(input: string): string | null {
    if (!input) return null;
    const match = input.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (match) return match[1].toUpperCase();
    const qMatch = input.match(/[?&]asin[s]?=([A-Z0-9]{10})/i);
    if (qMatch) return qMatch[1].toUpperCase();
    const nakedMatch = input.match(/\b([A-Z0-9]{10})\b/);
    if (nakedMatch && /^[A-Z0-9]{10}$/.test(nakedMatch[1])) return nakedMatch[1].toUpperCase();
    return null;
}

// GET /api/products - 商品一覧取得
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    try {
        const products = await (prisma as any).product.findMany({
            where: category && category !== 'all' ? { category } : {},
            orderBy: [
                { isFeatured: 'desc' },
                { displayOrder: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        return NextResponse.json(products || []);
    } catch (error) {
        console.error('Fetch products error:', error);
        return NextResponse.json([]);
    }
}

// POST /api/products - 商品登録
export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 指定された特定のユーザーIDのみを許可
    const isAdmin = userId === 'cmluyaayl0002qlbmwdujkht4';

    if (!isAdmin) {
        return NextResponse.json({ error: '管理者権限が必要です。' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, description, amazonUrl, category, price, imageUrl: bodyImageUrl, isFeatured, displayOrder } = body;

        if (!title || !amazonUrl || !category) {
            return NextResponse.json({ error: '必須項目が不足しています。' }, { status: 400 });
        }

        const asin = extractAsinStrongly(amazonUrl);
        const imageUrl = bodyImageUrl || (asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null);

        const product = await (prisma as any).product.create({
            data: {
                title,
                description: description || '',
                amazonUrl,
                imageUrl,
                category,
                price: price || '',
                isFeatured: isFeatured === true,
                displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
            },
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('SERVER PRODUCT ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/products?id=xxx - 商品削除
export async function DELETE(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 指定された特定のユーザーIDのみを許可
    const isAdmin = userId === 'cmluyaayl0002qlbmwdujkht4';

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await (prisma as any).product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

