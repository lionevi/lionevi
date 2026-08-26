import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PaymentError } from '@/lib/payments/stripe';
import { StorageError } from '@/lib/storage';
import { AppError } from '@/server/session';

export interface ApiErrorBody {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

/** Reponse de succes normalisee. */
export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Convertit toute erreur en reponse HTTP exploitable par le client.
 * Les erreurs inattendues sont journalisees et masquees.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_';
      details[key] = [...(details[key] ?? []), issue.message];
    }
    return NextResponse.json(
      { error: 'Les donnees envoyees sont invalides.', code: 'VALIDATION_ERROR', details },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }

  if (error instanceof PaymentError) {
    const status = error.code === 'NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  if (error instanceof StorageError) {
    return NextResponse.json({ error: error.message, code: 'STORAGE_ERROR' }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cette ressource existe deja.', code: 'DUPLICATE' },
        { status: 409 },
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Ressource introuvable.', code: 'NOT_FOUND' }, { status: 404 });
    }
  }

  console.error('[api] erreur non geree :', error);
  return NextResponse.json(
    { error: 'Une erreur interne est survenue. Reessayez dans un instant.', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}

/** Corps JSON de la requete, avec message clair si le JSON est malforme. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('Corps de requete JSON invalide.', 400, 'INVALID_JSON');
  }
}

/** Adresse IP du client, derriere proxy (Vercel, Cloudflare). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'inconnue';
  return request.headers.get('x-real-ip') ?? 'inconnue';
}
