'use client';

import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Field } from '@/components/forms/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, CURRENCIES, SECTOR_TAGS } from '@/lib/constants';
import { projectSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';

export interface WizardValues {
  id?: string;
  title: string;
  tagline: string;
  category: string;
  sector_tags: string[];
  problem_statement: string;
  target_market: string;
  cover_image_url: string;
  executive_summary: string;
  market_size: string;
  competitive_advantage: string;
  full_description: string;
  solution_detail: string;
  business_model: string;
  implementation_steps: string[];
  resources_identified: string;
  video_url: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  implementation_months?: number;
  projected_revenue: string;
  selling_mode: 'FIXED_PRICE' | 'AUCTION';
  fixed_price?: number;
  auction_start_price?: number;
  auction_reserve_price?: number;
  auction_end_date: string;
  currency: string;
  similarity_note: string;
}

const EMPTY: WizardValues = {
  title: '',
  tagline: '',
  category: CATEGORIES[0],
  sector_tags: [],
  problem_statement: '',
  target_market: '',
  cover_image_url: '',
  executive_summary: '',
  market_size: '',
  competitive_advantage: '',
  full_description: '',
  solution_detail: '',
  business_model: '',
  implementation_steps: ['', '', ''],
  resources_identified: '',
  video_url: '',
  projected_revenue: '',
  selling_mode: 'FIXED_PRICE',
  auction_end_date: '',
  currency: 'XOF',
  similarity_note: '',
};

const STEPS = [
  { title: 'Couche publique', hint: 'Ce que tout le monde voit' },
  { title: 'Couche NDA', hint: 'Debloque apres signature' },
  { title: 'Couche privee', hint: "Debloque a l'achat" },
  { title: 'Prix et mise en vente', hint: 'Mode, prix, devise' },
] as const;

interface SubmissionResult {
  status: string;
  message: string;
  ai_score: number;
  display_level: string;
  similarity_status: string;
  similarity_max_score: number;
  similar_projects: Array<{ project_id: string; title: string; score: number; reason: string }>;
  content_hash: string;
  submitted_at: string;
  teaser: string;
  slug: string;
}

/** Assistant de depot en 4 etapes, avec enregistrement de brouillon a chaque etape. */
export function SellWizard({
  initialProject,
}: {
  initialProject: WizardValues | null;
}): React.JSX.Element {
  const router = useRouter();
  const [values, setValues] = useState<WizardValues>(initialProject ?? EMPTY);
  const [projectId, setProjectId] = useState<string | undefined>(initialProject?.id);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const update = <K extends keyof WizardValues>(key: K, value: WizardValues[K]): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  /** Champs valides a chaque etape, pour ne pas bloquer sur un champ ulterieur. */
  const STEP_FIELDS: string[][] = [
    ['title', 'tagline', 'category', 'problem_statement', 'target_market'],
    ['executive_summary', 'competitive_advantage', 'market_size'],
    ['full_description', 'solution_detail', 'business_model', 'implementation_steps'],
    [
      'selling_mode',
      'fixed_price',
      'auction_start_price',
      'auction_reserve_price',
      'auction_end_date',
      'currency',
      'estimated_cost_min',
      'estimated_cost_max',
    ],
  ];

  function toPayload(): Record<string, unknown> {
    return {
      ...values,
      implementation_steps: values.implementation_steps.filter((entry) => entry.trim().length > 0),
      cover_image_url: values.cover_image_url || undefined,
      video_url: values.video_url || undefined,
      market_size: values.market_size || undefined,
      resources_identified: values.resources_identified || undefined,
      projected_revenue: values.projected_revenue || undefined,
      similarity_note: values.similarity_note || undefined,
      auction_end_date: values.auction_end_date ? new Date(values.auction_end_date) : undefined,
    };
  }

  /** Valide uniquement les champs de l'etape courante. */
  function validateStep(index: number): boolean {
    const parsed = projectSchema.safeParse(toPayload());
    if (parsed.success) {
      setErrors({});
      return true;
    }

    const fields = STEP_FIELDS[index] ?? [];
    const stepErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (fields.includes(key) && !stepErrors[key]) stepErrors[key] = issue.message;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  async function saveDraft(): Promise<string | null> {
    setSaving(true);
    setGlobalError(null);

    try {
      const payload = { ...toPayload(), title: values.title || 'Brouillon sans titre' };
      const response = await fetch(projectId ? `/api/projects/${projectId}` : '/api/projects', {
        method: projectId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { project?: { id: string }; error?: string };
      if (!response.ok || !data.project) {
        setGlobalError(data.error ?? "Le brouillon n'a pas pu etre enregistre.");
        return null;
      }

      setProjectId(data.project.id);
      return data.project.id;
    } catch {
      setGlobalError('Impossible de contacter le serveur. Reessayez.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function goNext(): Promise<void> {
    if (!validateStep(step)) return;
    await saveDraft();
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(): Promise<void> {
    setGlobalError(null);

    const parsed = projectSchema.safeParse(toPayload());
    if (!parsed.success) {
      const allErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (!allErrors[key]) allErrors[key] = issue.message;
      }
      setErrors(allErrors);

      const firstStep = STEP_FIELDS.findIndex((fields) =>
        fields.some((field) => allErrors[field]),
      );
      if (firstStep >= 0) setStep(firstStep);
      setGlobalError('Certains champs obligatoires sont incomplets.');
      return;
    }

    const id = await saveDraft();
    if (!id) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${id}/submit`, { method: 'POST' });
      const data = (await response.json()) as SubmissionResult & { error?: string };

      if (!response.ok) {
        setGlobalError(data.error ?? "La soumission a echoue.");
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setGlobalError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <SubmissionSummary result={result} projectId={projectId} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Etapes */}
      <nav aria-label="Etapes du depot" className="lg:sticky lg:top-24 lg:self-start">
        <Progress value={((step + 1) / STEPS.length) * 100} className="mb-4" />
        <ol className="space-y-1">
          {STEPS.map((entry, index) => (
            <li key={entry.title}>
              <button
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                  index === step ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                )}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="block text-sm font-semibold">
                  {index + 1}. {entry.title}
                </span>
                <span className="block text-xs text-muted-foreground">{entry.hint}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div>
        {globalError && (
          <Alert variant="error" className="mb-5">
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]?.title}</CardTitle>
            <CardDescription>
              {step === 0 && 'Ces informations sont visibles par tous les visiteurs.'}
              {step === 1 && "Visible uniquement apres signature de l'accord de confidentialite."}
              {step === 2 && "Le coeur de votre dossier : debloque uniquement pour l'acquereur."}
              {step === 3 && 'Definissez votre mode de vente et votre prix.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {step === 0 && (
              <>
                <Field
                  id="title"
                  label="Titre du projet"
                  required
                  error={errors.title}
                  hint="Court et explicite, 8 a 120 caracteres."
                >
                  <Input
                    id="title"
                    value={values.title}
                    onChange={(event) => update('title', event.target.value)}
                    placeholder="Plateforme de collecte de dechets plastiques a Cotonou"
                  />
                </Field>

                <Field
                  id="tagline"
                  label="Accroche"
                  required
                  error={errors.tagline}
                  hint="Une phrase qui donne envie, sans reveler la solution."
                >
                  <Input
                    id="tagline"
                    value={values.tagline}
                    onChange={(event) => update('tagline', event.target.value)}
                    placeholder="Transformer un dechet urbain en matiere premiere rentable"
                  />
                </Field>

                <Field id="category" label="Categorie" required error={errors.category}>
                  <select
                    id="category"
                    value={values.category}
                    onChange={(event) => update('category', event.target.value)}
                    className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Tags sectoriels (8 maximum)</legend>
                  <div className="flex flex-wrap gap-2">
                    {SECTOR_TAGS.map((tag) => {
                      const selected = values.sector_tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            update(
                              'sector_tags',
                              selected
                                ? values.sector_tags.filter((entry) => entry !== tag)
                                : values.sector_tags.length < 8
                                  ? [...values.sector_tags, tag]
                                  : values.sector_tags,
                            )
                          }
                          aria-pressed={selected}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/40',
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <Field
                  id="problem_statement"
                  label="Le probleme adresse"
                  required
                  error={errors.problem_statement}
                  hint="Decrivez le probleme, pas la solution. 60 caracteres minimum."
                >
                  <Textarea
                    id="problem_statement"
                    rows={5}
                    value={values.problem_statement}
                    onChange={(event) => update('problem_statement', event.target.value)}
                  />
                </Field>

                <Field
                  id="target_market"
                  label="Marche cible"
                  required
                  error={errors.target_market}
                  hint="Qui sont les clients, ou sont-ils, combien sont-ils ?"
                >
                  <Textarea
                    id="target_market"
                    rows={4}
                    value={values.target_market}
                    onChange={(event) => update('target_market', event.target.value)}
                  />
                </Field>

                <Field
                  id="cover_image_url"
                  label="Image de couverture (URL)"
                  error={errors.cover_image_url}
                  hint="Optionnel. Une image augmente sensiblement le taux de clic."
                >
                  <Input
                    id="cover_image_url"
                    type="url"
                    value={values.cover_image_url}
                    onChange={(event) => update('cover_image_url', event.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Alert variant="info">
                  <AlertDescription>
                    Ces trois champs ne sont visibles qu&apos;apres signature du NDA. Ils doivent
                    convaincre sans livrer le mode operatoire.
                  </AlertDescription>
                </Alert>

                <Field
                  id="executive_summary"
                  label="Resume executif"
                  required
                  error={errors.executive_summary}
                  hint="100 caracteres minimum. Le pitch complet de l'opportunite."
                >
                  <Textarea
                    id="executive_summary"
                    rows={6}
                    value={values.executive_summary}
                    onChange={(event) => update('executive_summary', event.target.value)}
                  />
                </Field>

                <Field
                  id="market_size"
                  label="Taille de marche estimee"
                  error={errors.market_size}
                  hint="Chiffres, sources, hypotheses de calcul."
                >
                  <Textarea
                    id="market_size"
                    rows={3}
                    value={values.market_size}
                    onChange={(event) => update('market_size', event.target.value)}
                  />
                </Field>

                <Field
                  id="competitive_advantage"
                  label="Avantage concurrentiel"
                  required
                  error={errors.competitive_advantage}
                  hint="Pourquoi cette idee gagne face a l'existant."
                >
                  <Textarea
                    id="competitive_advantage"
                    rows={4}
                    value={values.competitive_advantage}
                    onChange={(event) => update('competitive_advantage', event.target.value)}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Alert variant="warning">
                  <AlertDescription>
                    Contenu reserve a l&apos;acquereur. C&apos;est ce qui justifie votre prix :
                    soyez precis et operationnel.
                  </AlertDescription>
                </Alert>

                <Field
                  id="full_description"
                  label="Description complete"
                  required
                  error={errors.full_description}
                  hint="200 caracteres minimum."
                >
                  <Textarea
                    id="full_description"
                    rows={8}
                    value={values.full_description}
                    onChange={(event) => update('full_description', event.target.value)}
                  />
                </Field>

                <Field
                  id="solution_detail"
                  label="La solution en detail"
                  required
                  error={errors.solution_detail}
                  hint="Le &laquo; comment &raquo; : fonctionnement, technologie, organisation."
                >
                  <Textarea
                    id="solution_detail"
                    rows={7}
                    value={values.solution_detail}
                    onChange={(event) => update('solution_detail', event.target.value)}
                  />
                </Field>

                <Field
                  id="business_model"
                  label="Modele economique"
                  required
                  error={errors.business_model}
                  hint="Sources de revenus, structure de couts, marges."
                >
                  <Textarea
                    id="business_model"
                    rows={5}
                    value={values.business_model}
                    onChange={(event) => update('business_model', event.target.value)}
                  />
                </Field>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium">
                    Etapes de realisation <span className="text-primary">*</span>
                  </legend>
                  {errors.implementation_steps && (
                    <p role="alert" className="mb-2 text-xs font-medium text-error">
                      {errors.implementation_steps}
                    </p>
                  )}
                  <div className="space-y-2">
                    {values.implementation_steps.map((entry, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <Input
                          value={entry}
                          onChange={(event) => {
                            const next = [...values.implementation_steps];
                            next[index] = event.target.value;
                            update('implementation_steps', next);
                          }}
                          placeholder={`Etape ${index + 1}`}
                          aria-label={`Etape ${index + 1}`}
                        />
                        {values.implementation_steps.length > 3 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              update(
                                'implementation_steps',
                                values.implementation_steps.filter((_, i) => i !== index),
                              )
                            }
                            aria-label={`Supprimer l etape ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {values.implementation_steps.length < 20 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        update('implementation_steps', [...values.implementation_steps, ''])
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter une etape
                    </Button>
                  )}
                </fieldset>

                <Field
                  id="resources_identified"
                  label="Ressources identifiees"
                  error={errors.resources_identified}
                  hint="Fournisseurs, partenaires, contacts, outils deja reperes."
                >
                  <Textarea
                    id="resources_identified"
                    rows={4}
                    value={values.resources_identified}
                    onChange={(event) => update('resources_identified', event.target.value)}
                  />
                </Field>

                <Field
                  id="video_url"
                  label="Video de presentation"
                  error={errors.video_url}
                  hint="Lien YouTube ou Vimeo (optionnel)."
                >
                  <Input
                    id="video_url"
                    type="url"
                    value={values.video_url}
                    onChange={(event) => update('video_url', event.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">
                    Mode de vente <span className="text-primary">*</span>
                  </legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      {
                        value: 'FIXED_PRICE' as const,
                        label: 'Prix fixe',
                        hint: 'Vente immediate au premier acheteur',
                      },
                      {
                        value: 'AUCTION' as const,
                        label: 'Enchere',
                        hint: 'Le meilleur offrant emporte le dossier',
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => update('selling_mode', option.value)}
                        aria-pressed={values.selling_mode === option.value}
                        className={cn(
                          'rounded-lg border p-4 text-left transition-colors',
                          values.selling_mode === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Field id="currency" label="Devise" required error={errors.currency}>
                  <select
                    id="currency"
                    value={values.currency}
                    onChange={(event) => update('currency', event.target.value)}
                    className="h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>

                {values.selling_mode === 'FIXED_PRICE' ? (
                  <Field
                    id="fixed_price"
                    label="Prix de vente"
                    required
                    error={errors.fixed_price}
                    hint="Une commission de 10 % est prelevee a la vente."
                  >
                    <Input
                      id="fixed_price"
                      type="number"
                      min={1}
                      value={values.fixed_price ?? ''}
                      onChange={(event) =>
                        update('fixed_price', event.target.value ? Number(event.target.value) : undefined)
                      }
                    />
                  </Field>
                ) : (
                  <>
                    <Field
                      id="auction_start_price"
                      label="Prix de depart"
                      required
                      error={errors.auction_start_price}
                    >
                      <Input
                        id="auction_start_price"
                        type="number"
                        min={1}
                        value={values.auction_start_price ?? ''}
                        onChange={(event) =>
                          update(
                            'auction_start_price',
                            event.target.value ? Number(event.target.value) : undefined,
                          )
                        }
                      />
                    </Field>

                    <Field
                      id="auction_reserve_price"
                      label="Prix de reserve"
                      error={errors.auction_reserve_price}
                      hint="Jamais affiche aux acheteurs. En dessous, la vente ne se fait pas."
                    >
                      <Input
                        id="auction_reserve_price"
                        type="number"
                        min={1}
                        value={values.auction_reserve_price ?? ''}
                        onChange={(event) =>
                          update(
                            'auction_reserve_price',
                            event.target.value ? Number(event.target.value) : undefined,
                          )
                        }
                      />
                    </Field>

                    <Field
                      id="auction_end_date"
                      label="Fin de l'enchere"
                      required
                      error={errors.auction_end_date}
                      hint="Duree minimale d'une heure."
                    >
                      <Input
                        id="auction_end_date"
                        type="datetime-local"
                        value={values.auction_end_date}
                        onChange={(event) => update('auction_end_date', event.target.value)}
                      />
                    </Field>
                  </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="estimated_cost_min"
                    label="Budget de lancement (min)"
                    error={errors.estimated_cost_min}
                  >
                    <Input
                      id="estimated_cost_min"
                      type="number"
                      min={0}
                      value={values.estimated_cost_min ?? ''}
                      onChange={(event) =>
                        update(
                          'estimated_cost_min',
                          event.target.value ? Number(event.target.value) : undefined,
                        )
                      }
                    />
                  </Field>

                  <Field
                    id="estimated_cost_max"
                    label="Budget de lancement (max)"
                    error={errors.estimated_cost_max}
                  >
                    <Input
                      id="estimated_cost_max"
                      type="number"
                      min={0}
                      value={values.estimated_cost_max ?? ''}
                      onChange={(event) =>
                        update(
                          'estimated_cost_max',
                          event.target.value ? Number(event.target.value) : undefined,
                        )
                      }
                    />
                  </Field>
                </div>

                <Field
                  id="implementation_months"
                  label="Duree de mise en oeuvre (mois)"
                  error={errors.implementation_months}
                >
                  <Input
                    id="implementation_months"
                    type="number"
                    min={1}
                    max={120}
                    value={values.implementation_months ?? ''}
                    onChange={(event) =>
                      update(
                        'implementation_months',
                        event.target.value ? Number(event.target.value) : undefined,
                      )
                    }
                  />
                </Field>

                <Field
                  id="projected_revenue"
                  label="Revenus projetes"
                  error={errors.projected_revenue}
                  hint="Hypotheses de chiffre d'affaires sur 12 a 36 mois."
                >
                  <Textarea
                    id="projected_revenue"
                    rows={3}
                    value={values.projected_revenue}
                    onChange={(event) => update('projected_revenue', event.target.value)}
                  />
                </Field>

                <Field
                  id="similarity_note"
                  label="Note de differenciation"
                  error={errors.similarity_note}
                  hint="A remplir si une idee proche existe deja : expliquez ce qui vous distingue."
                >
                  <Textarea
                    id="similarity_note"
                    rows={3}
                    value={values.similarity_note}
                    onChange={(event) => update('similarity_note', event.target.value)}
                  />
                </Field>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Precedent
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => void saveDraft()}
              disabled={saving || !values.title}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer le brouillon
            </Button>
          </div>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => void goNext()} disabled={saving}>
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={() => void submit()} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Soumettre pour publication
            </Button>
          )}
        </div>

        {submitting && (
          <Alert className="mt-4">
            <AlertTitle>Analyse en cours</AlertTitle>
            <AlertDescription>
              Empreinte SHA-256, controle d&apos;unicite, evaluation IA puis generation du teaser.
              Cette operation prend generalement moins d&apos;une minute.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

/** Ecran de resultat du pipeline de soumission. */
function SubmissionSummary({
  result,
  projectId,
}: {
  result: SubmissionResult;
  projectId?: string;
}): React.JSX.Element {
  const published = result.status === 'PUBLISHED';
  const rejected = result.status === 'REJECTED';

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardContent className="pt-8">
          <div className="text-center">
            <span
              className={cn(
                'mx-auto flex h-14 w-14 items-center justify-center rounded-full',
                published ? 'bg-success/15' : rejected ? 'bg-error/10' : 'bg-warning/15',
              )}
            >
              {published ? (
                <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
              ) : (
                <AlertTriangle
                  className={cn('h-7 w-7', rejected ? 'text-error' : 'text-warning')}
                  aria-hidden
                />
              )}
            </span>

            <h2 className="mt-5 font-display text-2xl font-bold">
              {published
                ? 'Votre projet est en ligne'
                : rejected
                  ? 'Publication refusee'
                  : 'En attente de validation'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {result.message}
            </p>
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Score IA</dt>
              <dd className="mt-1 font-display text-2xl font-bold">
                {result.ai_score}
                <span className="text-base font-semibold text-muted-foreground">/100</span>
              </dd>
              <Badge className="mt-2">{result.display_level}</Badge>
            </div>

            <div className="rounded-lg border border-border p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Controle d&apos;unicite
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold">
                {result.similarity_max_score}%
              </dd>
              <Badge variant="muted" className="mt-2">
                {result.similarity_status}
              </Badge>
            </div>
          </dl>

          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Empreinte d&apos;anteriorite
            </p>
            <p className="mt-1 break-all font-mono text-xs">{result.content_hash}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Horodatee le {new Date(result.submitted_at).toLocaleString('fr-FR')}
            </p>
          </div>

          {result.similar_projects.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Projets proches identifies</h3>
              <ul className="mt-2 space-y-2">
                {result.similar_projects.map((similar) => (
                  <li
                    key={similar.project_id}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{similar.title}</span>
                      <Badge variant={similar.score > 60 ? 'warning' : 'muted'}>
                        {similar.score}%
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{similar.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.teaser && (
            <div className="mt-4 rounded-lg border border-secondary/30 bg-secondary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-secondary-600">
                Teaser public genere
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">{result.teaser}</p>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {published ? (
              <Button asChild>
                <a href={`/projets/${result.slug}`}>Voir mon annonce</a>
              </Button>
            ) : (
              <Button asChild>
                <a href={projectId ? `/vendre?projet=${projectId}` : '/tableau-de-bord/projets'}>
                  Corriger mon dossier
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <a href="/tableau-de-bord/projets">Mes projets</a>
            </Button>
            {projectId && (
              <Button asChild variant="ghost">
                <a href={`/api/projects/${projectId}/certificat`}>Certificat d&apos;anteriorite</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
