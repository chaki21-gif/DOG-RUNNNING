import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function RootPage() {
  const userId = await getSession();
  if (!userId) {
    redirect('/login');
  }

  const dog = await prisma.dog.findFirst({ where: { ownerId: userId } });
  if (!dog) {
    redirect('/onboarding');
  }

  redirect('/app');
}
