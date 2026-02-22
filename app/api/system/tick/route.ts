import { NextRequest, NextResponse } from 'next/server';
import { runTick } from '@/lib/scheduler';

export async function POST(req: NextRequest) {
    const token = req.headers.get('x-system-token');
    const expectedToken = process.env.SYSTEM_TOKEN;

    if (!expectedToken || token !== expectedToken) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const stats = await runTick();
        return NextResponse.json({ ok: true, stats });
    } catch (error) {
        console.error('Tick error:', error);
        return NextResponse.json({ error: 'Tick failed', details: String(error) }, { status: 500 });
    }
}
