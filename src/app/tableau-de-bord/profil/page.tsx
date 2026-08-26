import type { Metadata } from 'next';
import { ProfileForm } from '@/app/tableau-de-bord/profil/profile-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { requireUser } from '@/server/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Mon profil', robots: { index: false, follow: false } };

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const user = await requireUser();

  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      bio: true,
      country: true,
      phone: true,
      avatar_url: true,
      role: true,
      email_verified: true,
      created_at: true,
      reviews_received: { select: { rating: true, comment: true, created_at: true }, take: 10 },
    },
  });

  const ratings = profile.reviews_received.map((review) => review.rating);
  const average =
    ratings.length > 0 ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Mon profil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ces informations sont visibles par les acheteurs et les vendeurs avec qui vous echangez.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <ProfileForm
          initial={{
            name: profile.name,
            bio: profile.bio ?? '',
            country: profile.country,
            phone: profile.phone ?? '',
            avatar_url: profile.avatar_url ?? '',
          }}
        />

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Email : </span>
                {profile.email}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Statut : </span>
                <Badge variant={profile.email_verified ? 'success' : 'warning'}>
                  {profile.email_verified ? 'Verifie' : 'Non verifie'}
                </Badge>
              </p>
              <p>
                <span className="text-muted-foreground">Role : </span>
                {profile.role}
              </p>
              <p>
                <span className="text-muted-foreground">Inscrit le : </span>
                {formatDate(profile.created_at)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Avis recus {average !== null && `— ${average.toFixed(1)}/5`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.reviews_received.length > 0 ? (
                <ul className="space-y-3">
                  {profile.reviews_received.map((review) => (
                    <li key={review.created_at.toISOString()} className="text-sm">
                      <p className="font-semibold">{review.rating}/5</p>
                      {review.comment && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{review.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
