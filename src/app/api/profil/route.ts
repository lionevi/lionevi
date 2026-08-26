import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validation';
import { requireUser } from '@/server/session';

/** Mise a jour du profil de l'utilisateur connecte. */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const user = await requireUser();
    const input = profileSchema.parse(await readJson(request));

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        bio: input.bio ?? null,
        country: input.country,
        phone: input.phone ?? null,
        avatar_url: input.avatar_url ?? null,
      },
      select: { id: true, name: true, bio: true, country: true, phone: true, avatar_url: true },
    });

    return ok({ user: updated, message: 'Profil mis a jour.' });
  } catch (error) {
    return handleApiError(error);
  }
}
