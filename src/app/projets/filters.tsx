'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/lib/constants';

const SORTS = [
  { value: 'score', label: 'Score IA' },
  { value: 'recent', label: 'Plus recents' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix decroissant' },
  { value: 'populaire', label: 'Les plus vus' },
] as const;

const LEVELS = [
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'FEATURED', label: 'Featured' },
  { value: 'STANDARD', label: 'Standard' },
] as const;

const selectClass =
  'h-11 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Barre de filtres de la marketplace, synchronisee avec l'URL. */
export function ProjectFilters(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const current = (key: string): string => params.get(key) ?? '';

  function apply(next: Record<string, string>): void {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    search.delete('page');
    router.push(`${pathname}?${search.toString()}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    apply({ q: String(formData.get('q') ?? '').trim() });
  }

  const hasFilters = ['q', 'categorie', 'mode', 'niveau', 'prix_min', 'prix_max'].some((key) =>
    params.get(key),
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={current('q')}
            placeholder="Rechercher une idee, un secteur, un probleme..."
            className="pl-10"
            aria-label="Rechercher un projet"
          />
        </form>

        <select
          value={current('tri') || 'score'}
          onChange={(event) => apply({ tri: event.target.value })}
          className={`${selectClass} sm:w-48`}
          aria-label="Trier les resultats"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="outline"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 grid animate-fade-in gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={current('categorie')}
            onChange={(event) => apply({ categorie: event.target.value })}
            className={selectClass}
            aria-label="Categorie"
          >
            <option value="">Toutes les categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={current('mode')}
            onChange={(event) => apply({ mode: event.target.value })}
            className={selectClass}
            aria-label="Mode de vente"
          >
            <option value="">Tous les modes de vente</option>
            <option value="FIXED_PRICE">Prix fixe</option>
            <option value="AUCTION">Enchere</option>
          </select>

          <select
            value={current('niveau')}
            onChange={(event) => apply({ niveau: event.target.value })}
            className={selectClass}
            aria-label="Niveau d'evaluation"
          >
            <option value="">Tous les niveaux</option>
            {LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Prix min"
              defaultValue={current('prix_min')}
              onBlur={(event) => apply({ prix_min: event.target.value })}
              aria-label="Prix minimum"
            />
            <Input
              type="number"
              min={0}
              placeholder="Prix max"
              defaultValue={current('prix_max')}
              onBlur={(event) => apply({ prix_max: event.target.value })}
              aria-label="Prix maximum"
            />
          </div>
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <X className="h-3.5 w-3.5" />
          Reinitialiser les filtres
        </button>
      )}
    </div>
  );
}
