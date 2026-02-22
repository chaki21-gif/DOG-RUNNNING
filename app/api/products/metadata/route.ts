import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ASINをURLやHTMLスニペットから抽出する
function extractAsinStrongly(input: string): string | null {
    if (!input) return null;

    // 1. Standard dp/gp urls
    const match = input.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (match) return match[1].toUpperCase();

    // 2. Query param asin (Amazon Ads or standard)
    const qMatch = input.match(/[?&]asin[s]?=([A-Z0-9]{10})/i);
    if (qMatch) return qMatch[1].toUpperCase();

    // 3. Just a naked ASIN in the string
    const nakedMatch = input.match(/\b([A-Z0-9]{10})\b/);
    // ただし、これが本当にASINか判定するのは難しいが、Amazonの文脈なら可能性高い
    if (nakedMatch && /^[A-Z0-9]{10}$/.test(nakedMatch[1])) return nakedMatch[1].toUpperCase();

    return null;
}

// URLを抽出（HTMLスニペットだった場合）
function extractUrl(input: string): string {
    if (input.startsWith('http')) return input;
    // iframeなどのsrcを探す
    const srcMatch = input.match(/src=["'](.*?)["']/);
    if (srcMatch) {
        let url = srcMatch[1];
        if (url.startsWith('//')) url = 'https:' + url;
        return url;
    }
    return input;
}

export async function GET(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const rawInput = searchParams.get('url');

    if (!rawInput) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    try {
        const inputUrl = extractUrl(rawInput);
        let asin = extractAsinStrongly(rawInput) || extractAsinStrongly(inputUrl);

        // Fetch to follow redirects (amzn.to -> amazon.co.jp)
        let finalUrl = inputUrl;
        let html = '';
        try {
            const res = await fetch(inputUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                redirect: 'follow',
                next: { revalidate: 3600 }
            });
            finalUrl = res.url;
            if (res.ok) html = await res.text();

            // リダイレクト先から再度ASINを試みる
            if (!asin) asin = extractAsinStrongly(finalUrl);
        } catch (e) {
            console.error('Fetch failed but continuing with existing info');
        }

        let title = '';
        let price = '';
        // Fallback image using ASIN
        let imageUrl = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;

        if (html) {
            // Title
            const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/);
            const titleTag = html.match(/<title>(.*?)<\/title>/);
            const amazonTitle = html.match(/id="productTitle"[^>]*>\s*(.*?)\s*<\/span>/);
            title = amazonTitle ? amazonTitle[1] : (ogTitle ? ogTitle[1] : (titleTag ? titleTag[1] : ''));
            if (title) title = title.replace(/Amazon\.co\.jp[:\s\|].*$/, '').replace(/\s+/g, ' ').trim();

            // Image
            const ogImage = html.match(/<meta property="og:image" content="(.*?)"/);
            const mainImg = html.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/.*?\.jpg)"/);
            if (mainImg) imageUrl = mainImg[1];
            else if (ogImage) imageUrl = ogImage[1];

            // Price
            const amazonPrice = html.match(/<span class="a-price-whole">([\d,]+)/);
            if (amazonPrice) price = `¥${amazonPrice[1]}`;
        }

        return NextResponse.json({
            title: title || '商品詳細 (手動入力してください)',
            imageUrl: imageUrl,
            price: price || '¥---',
            asin,
            finalUrl
        });
    } catch (error) {
        console.error('Metadata fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
