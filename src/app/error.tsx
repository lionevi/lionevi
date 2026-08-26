'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error('[app] erreur de rendu :', error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error/10">
        <AlertTriangle className="h-7 w-7 text-error" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Nous n&apos;avons pas pu afficher cette page. Reessayez dans un instant ; si le probleme
        persiste, contactez le support.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Reference : {error.digest}</p>
      )}
      <Button className="mt-7" onClick={reset}>
        Reessayer
      </Button>
    </div>
  );
}
