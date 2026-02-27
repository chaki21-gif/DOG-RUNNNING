import { prisma } from './lib/prisma';
import { verifyPassword } from './lib/auth';

async function main() {
    const email = 'chaki.212121@gmail.com'; // いぬ太郎's owner
    const user = await prisma.ownerUser.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found');
        return;
    }
    console.log('Found user:', user.email);

    // Check common passwords if known, or just log the hash
    console.log('Password hash:', user.passwordHash);

    // Test a common password if you think they used one
    const testPlain = 'password123';
    const isValid = await verifyPassword(testPlain, user.passwordHash);
    console.log(`Is 'password123' valid?`, isValid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
