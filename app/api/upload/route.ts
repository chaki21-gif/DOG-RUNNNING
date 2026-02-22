import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
