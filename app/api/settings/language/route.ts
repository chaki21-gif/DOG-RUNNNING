import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const SUPPORTED_LANGUAGES = ['ja', 'en', 'ko', 'zh-TW', 'zh-CN'];

export async function PATCH(req: NextRequest) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language } = await req.json();
    if (!SUPPORTED_LANGUAGES.includes(language)) {
        return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    await prisma.ownerUser.update({
        where: { id: userId },
        data: { language },
    });

    return NextResponse.json({ ok: true, language });
}
