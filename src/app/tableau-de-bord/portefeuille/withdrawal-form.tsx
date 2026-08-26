'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/forms/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

type Method = 'WAVE' | 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY';

interface WithdrawalFormProps {
  balance: number;
  defaultPhone: string;
  providers: Array<{ method: Method; label: string }>;
}

/** Demande de retrait vers un compte Mobile Money. */
export function WithdrawalForm({
  balance,
  defaultPhone,
  providers,
}: WithdrawalFormProps): React.JSX.Element {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>(providers[0]?.method ?? 'WAVE');
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Saisissez un montant valide.');
      return;
    }
    if (value > balance) {
      setError('Le montant demande depasse votre solde.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/portefeuille/retrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, method, phone }),
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? 'La demande de retrait a echoue.');
        return;
      }

      setSuccess(data.message ?? 'Demande de retrait enregistree.');
      setAmount('');
      router.refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (providers.length === 0) {
    return (
      <Card className="lg:sticky lg:top-24 lg:self-start">
        <CardHeader>
          <CardTitle>Retrait</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucun operateur Mobile Money n&apos;est disponible pour votre pays. Contactez le support
            pour organiser un virement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:sticky lg:top-24 lg:self-start">
      <CardHeader>
        <CardTitle>Retirer mes fonds</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Field
            id="withdraw-amount"
            label="Montant"
            required
            hint={`Disponible : ${formatCurrency(balance)}`}
          >
            <Input
              id="withdraw-amount"
              type="number"
              min={1}
              max={balance}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </Field>

          <Field id="withdraw-method" label="Operateur" required>
            <select
              id="withdraw-method"
              value={method}
              onChange={(event) => setMethod(event.target.value as Method)}
              className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {providers.map((provider) => (
                <option key={provider.method} value={provider.method}>
                  {provider.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="withdraw-phone" label="Numero de reception" required>
            <Input
              id="withdraw-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+229 97 00 00 00"
              required
            />
          </Field>

          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading || balance <= 0}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Demander le retrait
          </Button>

          <p className="text-xs text-muted-foreground">
            Les retraits sont traites sous 48 heures ouvrees.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
