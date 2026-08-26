import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { ModerationQueue } from '@/app/admin/moderation/moderation-queue';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, truncate } from '@/lib/utils';
import { listBlockedMessages, listModerationQueue } from '@/server/admin';
import { requireAdmin } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Moderation',
  robots: { index: false, follow: false },
};

export default async function ModerationPage(): Promise<React.JSX.Element> {
  await requireAdmin();

  const [queue, blockedMessages] = await Promise.all([
    listModerationQueue(),
    listBlockedMessages(20),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-bold">Projets en attente de decision</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dossiers signales par le pipeline : similarite elevee ou verdict d&apos;evaluation
          reserve.
        </p>

        {queue.length > 0 ? (
          <div className="mt-4">
            <ModerationQueue
              items={queue.map((item) => ({
                id: item.id,
                slug: item.slug,
                title: item.title,
                tagline: item.tagline,
                category: item.category,
                status: item.status,
                ai_score: item.ai_score,
                similarity_status: item.similarity_status,
                similarity_note: item.similarity_note,
                content_hash: item.content_hash,
                submitted_at: item.submitted_at ? item.submitted_at.toISOString() : null,
                seller: item.seller,
                similar_projects: Array.isArray(item.similar_projects)
                  ? (item.similar_projects as Array<{
                      project_id: string;
                      title: string;
                      score: number;
                      reason: string;
                    }>)
                  : [],
              }))}
            />
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={ShieldCheck}
              title="File vide"
              description="Aucun dossier n'attend de decision humaine."
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Messages bloques</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages retenus par le filtre : coordonnees directes ou tentative de sortie de
          plateforme.
        </p>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">{blockedMessages.length} message(s) retenu(s)</CardTitle>
          </CardHeader>
          <CardContent>
            {blockedMessages.length > 0 ? (
              <ul className="divide-y divide-border">
                {blockedMessages.map((message) => (
                  <li key={message.id} className="py-3">
                    <p className="text-xs text-muted-foreground">
                      {message.sender.name} ({message.sender.email}) → {message.receiver.name} —{' '}
                      {formatDateTime(message.created_at)}
                    </p>
                    <p className="mt-1 text-sm">{truncate(message.content, 220)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun message bloque.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
