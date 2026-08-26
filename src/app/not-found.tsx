import { Compass } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Compass className="h-7 w-7 text-primary" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold">Page introuvable</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Cette page n&apos;existe pas ou n&apos;est plus accessible. Le projet que vous cherchez a
        peut-etre ete retire ou vendu.
      </p>
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <Button asChild>
          <Link href="/projets">Explorer les projets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Retour a l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
