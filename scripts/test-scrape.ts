const url = 'https://www.amazon.co.jp/dp/B01N2H8T8X';
const shortUrl = 'https://amzn.to/3VzXyAb';

async function test(targetUrl: string) {
    console.log(`--- Testing URL: ${targetUrl} ---`);
    try {
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
            },
            redirect: 'follow'
        });
        const finalUrl = res.url;
        console.log('Final URL:', finalUrl);
        const html = await res.text();
        console.log('HTML Length:', html.length);

        const ogImage = html.match(/<meta property="og:image" content="(.*?)"/);
        console.log('OG Image:', ogImage ? ogImage[1] : 'Not found');

        const landingImage = html.match(/id="landingImage"[^>]*src="(.*?)"/);
        console.log('Landing Image:', landingImage ? landingImage[1] : 'Not found');

        const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/);
        console.log('OG Title:', ogTitle ? ogTitle[1] : 'Not found');

        const priceMatch = html.match(/<span class="a-price-whole">([\d,]+)/);
        console.log('Price:', priceMatch ? priceMatch[1] : 'Not found');
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await test(url);
    await test(shortUrl);
}
run();
