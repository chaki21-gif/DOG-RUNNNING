import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetDogId } = await params;

    // Get the user's dog
    const myDog = await prisma.dog.findFirst({
        where: { ownerId: userId },
    });

    if (!myDog) {
        return NextResponse.json({ error: 'You need to register a dog first' }, { status: 400 });
    }

    if (myDog.id === targetDogId) {
        return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    try {
        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followedId: {
                    followerId: myDog.id,
                    followedId: targetDogId,
                },
            },
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: {
                    followerId_followedId: {
                        followerId: myDog.id,
                        followedId: targetDogId,
                    },
                },
            });
            return NextResponse.json({ following: false });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId: myDog.id,
                    followedId: targetDogId,
                },
            });
            return NextResponse.json({ following: true });
        }
    } catch (error) {
        console.error('Follow error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getSession();
        if (!userId) return NextResponse.json({ following: false });

        const { id: targetDogId } = await params;
        const myDog = await prisma.dog.findFirst({ where: { ownerId: userId } });
        if (!myDog) return NextResponse.json({ following: false });

        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followedId: {
                    followerId: myDog.id,
                    followedId: targetDogId,
                },
            },
        });

        return NextResponse.json({ following: !!follow });
    } catch (err: any) {
        const fs = require('fs');
        fs.appendFileSync('/tmp/api_follow_error.log', `[${new Date().toISOString()}] ${err.stack}\n`);
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}
