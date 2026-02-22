import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['ja', 'en', 'ko', 'zh-TW', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async () => {
    // Get locale from cookie or default to 'ja'
    const cookieStore = await cookies();
    const locale = (cookieStore.get('locale')?.value || defaultLocale) as Locale;

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default,
    };
});
