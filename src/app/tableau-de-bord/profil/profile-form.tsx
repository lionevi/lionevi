'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/forms/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { COUNTRIES } from '@/lib/constants';
import { profileSchema } from '@/lib/validation';

interface ProfileValues {
  name: string;
  bio: string;
  country: string;
  phone: string;
  avatar_url: string;
}

export function ProfileForm({ initial }: { initial: ProfileValues }): React.JSX.Element {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof ProfileValues, value: string): void =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setStatus(null);

    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus({ type: 'error', message: data.error ?? 'La mise a jour a echoue.' });
        return;
      }

      setStatus({ type: 'success', message: data.message ?? 'Profil mis a jour.' });
      router.refresh();
    } catch {
      setStatus({ type: 'error', message: 'Impossible de contacter le serveur. Reessayez.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations publiques</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field id="name" label="Nom complet" required error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </Field>

          <Field
            id="bio"
            label="Presentation"
            error={errors.bio}
            hint="Votre parcours, vos domaines d'expertise. 600 caracteres maximum."
          >
            <Textarea
              id="bio"
              rows={4}
              value={values.bio}
              onChange={(event) => update('bio', event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="country" label="Pays" required error={errors.country}>
              <select
                id="country"
                value={values.country}
                onChange={(event) => update('country', event.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="phone"
              label="Telephone"
              error={errors.phone}
              hint="Utilise pour les paiements et retraits Mobile Money."
            >
              <Input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="+229 97 00 00 00"
              />
            </Field>
          </div>

          <Field id="avatar_url" label="Photo de profil (URL)" error={errors.avatar_url}>
            <Input
              id="avatar_url"
              type="url"
              value={values.avatar_url}
              onChange={(event) => update('avatar_url', event.target.value)}
              placeholder="https://..."
            />
          </Field>

          {status && (
            <Alert variant={status.type === 'success' ? 'success' : 'error'}>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
