import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/app/connexion/login-form';
import { isGoogleAuthConfigured } from '@/lib/env';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous a votre compte IdeaMarket Africa.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}): Promise<React.JSX.Element> {
  const user = await getSessionUser();
  if (user) redirect(searchParams.callbackUrl ?? '/tableau-de-bord');

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Content de vous revoir</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Connectez-vous pour gerer vos idees, vos encheres et vos ventes.
          </p>
        </div>

        <LoginForm
          callbackUrl={searchParams.callbackUrl ?? '/tableau-de-bord'}
          initialError={searchParams.error}
          googleEnabled={isGoogleAuthConfigured()}
        />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="font-semibold text-primary hover:underline">
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
