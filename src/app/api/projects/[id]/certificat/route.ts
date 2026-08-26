import type { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/api';
import { generateAnteriorityCertificate } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';
import { conflict, forbidden, notFound, requireUser } from '@/server/session';

interface RouteContext {
  params: { id: string };
}

/** Certificat d'anteriorite du projet, reserve a son auteur et a l'administration. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<Response> {
  try {
    const user = await requireUser();

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { seller: { select: { name: true, email: true } } },
    });

    if (!project) throw notFound('Projet introuvable.');
    if (project.seller_id !== user.id && user.role !== 'ADMIN') {
      throw forbidden("Ce certificat n'est accessible qu'a l'auteur du depot.");
    }
    if (!project.content_hash || !project.submitted_at) {
      throw conflict("Ce projet n'a pas encore ete soumis : aucun certificat n'a ete emis.");
    }

    const pdf = await generateAnteriorityCertificate({
      projectTitle: project.title,
      ownerName: project.seller.name,
      ownerEmail: project.seller.email,
      contentHash: project.content_hash,
      submittedAt: project.submitted_at,
    });

    return new Response(pdf as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificat-anteriorite-${project.slug}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
