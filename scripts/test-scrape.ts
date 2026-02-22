
const url = 'https://www.amazon.co.jp/dp/B0006346FE';
async function test() {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await res.text();
        console.log('HTML Length:', html.length);
        const ogImage = html.match(/<meta property="og:image" content="(.*?)"/);
        console.log('OG Image:', ogImage ? ogImage[1] : 'Not found');
        const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/);
        console.log('OG Title:', ogTitle ? ogTitle[1] : 'Not found');

        // Price scraping is hard for Amazon, but let's try some common selectors
        const priceMatch = html.match(/<span class="a-price-whole">([\d,]+)/);
        console.log('Price:', priceMatch ? priceMatch[1] : 'Not found');
    } catch (e) {
        console.error(e);
    }
}
test();
