import { Role, type User } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/** Erreur metier portant un code HTTP, convertie en reponse par les routes API. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly code: string = 'BAD_REQUEST',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthorized = (message = 'Vous devez etre connecte.'): AppError =>
  new AppError(message, 401, 'UNAUTHORIZED');
export const forbidden = (message = "Vous n'avez pas acces a cette ressource."): AppError =>
  new AppError(message, 403, 'FORBIDDEN');
export const notFound = (message = 'Ressource introuvable.'): AppError =>
  new AppError(message, 404, 'NOT_FOUND');
export const conflict = (message = 'Operation impossible dans cet etat.'): AppError =>
  new AppError(message, 409, 'CONFLICT');

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: string;
}

/** Utilisateur courant, ou null si non connecte. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.is_banned) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? 'Utilisateur',
    email: session.user.email ?? '',
    role: session.user.role,
    country: session.user.country,
  };
}

/** Utilisateur courant, ou erreur 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

/** Utilisateur courant avec le role ADMIN, ou erreur 403. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) throw forbidden('Acces reserve a l administration.');
  return user;
}

/** Enregistrement complet de l'utilisateur courant. */
export async function requireDbUser(): Promise<User> {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) throw unauthorized('Session invalide.');
  if (user.is_banned) throw forbidden('Votre compte est suspendu.');
  return user;
}
