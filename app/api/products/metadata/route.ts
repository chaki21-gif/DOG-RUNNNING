import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function extractAsin(url: string): string | null {
    const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (match) return match[1].toUpperCase();
    const qMatch = url.match(/[?&]asin=([A-Z0-9]{10})/i);
    if (qMatch) return qMatch[1].toUpperCase();
    return null;
}

export async function GET(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    try {
        const asin = extractAsin(url);

        // Amazonの場合のデフォルト画像候補
        let imageUrl = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;
        let title = '';
        let price = '';

        // Fetch the page to get OGP and Price
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            }
        });

        if (res.ok) {
            const html = await res.text();

            // Title from OG or <title>
            const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/);
            const titleTag = html.match(/<title>(.*?)<\/title>/);
            title = ogTitle ? ogTitle[1] : (titleTag ? titleTag[1] : '');
            if (title) title = title.replace(/Amazon\.co\.jp[:\s\|].*$/, '').trim();

            // Image from OG
            const ogImage = html.match(/<meta property="og:image" content="(.*?)"/);
            if (ogImage) imageUrl = ogImage[1];

            // Price (Amazon specific or general)
            // Amazon pattern 1: <span class="a-price-whole">2,480</span>
            const amazonPrice = html.match(/<span class="a-price-whole">([\d,]+)/);
            if (amazonPrice) {
                price = `¥${amazonPrice[1]}`;
            } else {
                // Other sites might use og:price:amount
                const ogPrice = html.match(/<meta property="product:price:amount" content="(.*?)"/);
                const ogCurrency = html.match(/<meta property="product:price:currency" content="(.*?)"/);
                if (ogPrice) {
                    price = (ogCurrency ? (ogCurrency[1] === 'JPY' ? '¥' : ogCurrency[1]) : '¥') + ogPrice[1];
                }
            }
        }

        return NextResponse.json({
            title,
            imageUrl,
            price,
            asin
        });
    } catch (error) {
        console.error('Metadata fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
