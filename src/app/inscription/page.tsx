import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/app/inscription/register-form';
import { isGoogleAuthConfigured } from '@/lib/env';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = {
  title: 'Creer un compte',
  description: 'Rejoignez IdeaMarket Africa pour vendre ou acheter des idees de projets.',
};

export default async function RegisterPage(): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (user) redirect('/tableau-de-bord');

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Creer votre compte</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Vendez vos idees, achetez des projets prets a lancer.
          </p>
        </div>

        <RegisterForm googleEnabled={isGoogleAuthConfigured()} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Deja inscrit ?{' '}
          <Link href="/connexion" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
