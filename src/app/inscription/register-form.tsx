'use client';

import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/forms/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { COUNTRIES } from '@/lib/constants';
import { registerSchema } from '@/lib/validation';

const ROLES = [
  { value: 'BOTH', label: 'Les deux', hint: 'Vendre et acheter' },
  { value: 'SELLER', label: 'Vendeur', hint: 'Je depose des idees' },
  { value: 'BUYER', label: 'Acheteur', hint: 'Je cherche un projet' },
] as const;

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }): React.JSX.Element {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>('BOTH');
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setGlobalError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
      country: String(formData.get('country') ?? 'BJ'),
      role,
      acceptTerms: accepted,
    };

    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setGlobalError(data.error ?? 'La creation du compte a echoue.');
        return;
      }

      const signInResult = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push('/connexion');
        return;
      }

      router.push('/tableau-de-bord');
      router.refresh();
    } catch {
      setGlobalError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        {globalError && (
          <Alert variant="error" className="mb-5">
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field id="name" label="Nom complet" required error={errors.name}>
            <Input id="name" name="name" autoComplete="name" required placeholder="Awa Diallo" />
          </Field>

          <Field id="email" label="Adresse email" required error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.com"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="password"
              label="Mot de passe"
              required
              error={errors.password}
              hint="8 caracteres minimum, avec au moins une lettre et un chiffre."
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>

            <Field
              id="confirmPassword"
              label="Confirmer le mot de passe"
              required
              error={errors.confirmPassword}
            >
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          </div>

          <Field id="country" label="Pays" required error={errors.country}>
            <select
              id="country"
              name="country"
              defaultValue="BJ"
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Je souhaite</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    role === option.value
                      ? 'border-primary bg-primary/8'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="acceptTerms"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
            />
            <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
              J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialite.
            </Label>
          </div>
          {errors.acceptTerms && (
            <p role="alert" className="text-xs font-medium text-error">
              {errors.acceptTerms}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Creer mon compte
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
              onClick={() => void signIn('google', { callbackUrl: '/tableau-de-bord' })}
            >
              Continuer avec Google
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
