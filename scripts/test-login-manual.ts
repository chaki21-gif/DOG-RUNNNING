import { prisma } from '../lib/prisma';
import { verifyPassword } from '../lib/auth';

async function main() {
    const email = 'chaki.212121@gmail.com'; // いぬ太郎's owner
    const user = await prisma.ownerUser.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found');
        return;
    }
    console.log('Found user:', user.email);
    console.log('Password hash:', user.passwordHash);

    // We don't know the password, but we can check if it matches a likely candidate
    // Or just confirm it's a valid bcrypt hash
}

main().catch(console.error).finally(() => prisma.$disconnect());
