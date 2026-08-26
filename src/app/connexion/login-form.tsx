'use client';

import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/forms/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface LoginFormProps {
  callbackUrl: string;
  initialError?: string;
  googleEnabled: boolean;
}

/** Messages d'erreur NextAuth traduits. */
const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Email ou mot de passe incorrect.',
  OAuthAccountNotLinked: 'Cette adresse est deja utilisee avec un autre mode de connexion.',
  AccessDenied: "Votre compte n'est pas autorise a se connecter.",
  Configuration: "La connexion est momentanement indisponible.",
};

export function LoginForm({
  callbackUrl,
  initialError,
  googleEnabled,
}: LoginFormProps): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    initialError ? (ERROR_MESSAGES[initialError] ?? 'La connexion a echoue.') : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirect: false,
      });

      if (!result || result.error) {
        setError(ERROR_MESSAGES[result?.error ?? ''] ?? 'Email ou mot de passe incorrect.');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        {error && (
          <Alert variant="error" className="mb-5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field id="email" label="Adresse email" required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.com"
            />
          </Field>

          <Field id="password" label="Mot de passe" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="********"
            />
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Se connecter
          </Button>
        </form>

        {googleEnabled && (
          <>
            <div className="my-5 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void signIn('google', { callbackUrl })}
            >
              Continuer avec Google
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
