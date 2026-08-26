'use client';

import { CreditCard, Loader2, Smartphone, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/forms/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

type Method = 'STRIPE' | 'WALLET' | 'WAVE' | 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY';

interface CheckoutFormProps {
  projectId: string;
  projectSlug: string;
  amount: number;
  currency: string;
  walletBalance: number;
  defaultPhone: string;
  stripeEnabled: boolean;
  mobileMoneyProviders: Array<{ method: Method; label: string }>;
}

export function CheckoutForm({
  projectId,
  projectSlug,
  amount,
  currency,
  walletBalance,
  defaultPhone,
  stripeEnabled,
  mobileMoneyProviders,
}: CheckoutFormProps): React.JSX.Element {
  const router = useRouter();
  const walletSufficient = walletBalance >= amount;

  const [method, setMethod] = useState<Method>(
    stripeEnabled ? 'STRIPE' : walletSufficient ? 'WALLET' : (mobileMoneyProviders[0]?.method ?? 'STRIPE'),
  );
  const [phone, setPhone] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const isMobileMoney = mobileMoneyProviders.some((provider) => provider.method === method);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(null);
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          payment_method: method,
          phone: isMobileMoney ? phone : undefined,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        next_action?: 'REDIRECT' | 'CONFIRM_ON_PHONE' | 'DONE';
        redirect_url?: string | null;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? 'Le paiement n a pas pu etre initie.');
        return;
      }

      if (data.next_action === 'REDIRECT' && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      if (data.next_action === 'DONE') {
        router.push(`/projets/${projectSlug}/paiement/succes`);
        router.refresh();
        return;
      }

      setPending(data.message ?? 'Validez la demande depuis votre telephone.');
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setLoading(false);
    }
  }

  const options: Array<{ value: Method; label: string; hint: string; icon: typeof CreditCard; disabled?: boolean }> = [
    ...(stripeEnabled
      ? [
          {
            value: 'STRIPE' as Method,
            label: 'Carte bancaire',
            hint: 'Visa, Mastercard — paiement securise Stripe',
            icon: CreditCard,
          },
        ]
      : []),
    ...mobileMoneyProviders.map((provider) => ({
      value: provider.method,
      label: provider.label,
      hint: 'Validation depuis votre telephone',
      icon: Smartphone,
    })),
    {
      value: 'WALLET' as Method,
      label: 'Portefeuille IdeaMarket',
      hint: `Solde : ${formatCurrency(walletBalance, currency)}`,
      icon: Wallet,
      disabled: !walletSufficient,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moyen de paiement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <fieldset className="space-y-2.5">
            <legend className="sr-only">Choisir un moyen de paiement</legend>
            {options.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  method === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={option.value}
                  checked={method === option.value}
                  disabled={option.disabled}
                  onChange={() => setMethod(option.value)}
                  className="h-4 w-4 accent-[#E8622A]"
                />
                <option.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {isMobileMoney && (
            <Field
              id="phone"
              label="Numero Mobile Money"
              required
              hint="Format international, ex. +22997000000"
            >
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+229 97 00 00 00"
                required
              />
            </Field>
          )}

          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {pending && (
            <Alert variant="info">
              <AlertDescription>{pending}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Payer {formatCurrency(amount, currency)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
