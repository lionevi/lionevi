import { Role } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { handleApiError, ok, readJson } from '@/lib/api';
import { sendWelcomeEmail } from '@/lib/email';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { AppError } from '@/server/session';

/** Creation d'un compte email / mot de passe. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const input = registerSchema.parse(await readJson(request));

    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new AppError('Un compte existe deja avec cette adresse email.', 409, 'EMAIL_TAKEN');
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password_hash: await hashPassword(input.password),
        country: input.country,
        role: input.role as Role,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await sendWelcomeEmail(user.email, user.name);

    return ok({ user, message: 'Compte cree. Vous pouvez maintenant vous connecter.' }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
