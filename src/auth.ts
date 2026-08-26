import { PrismaAdapter } from '@auth/prisma-adapter';
import { Role } from '@prisma/client';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';
import { env, isGoogleAuthConfigured } from '@/lib/env';
import { verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.values(Role).includes(value as Role);
}

const providers: Provider[] = [
  Credentials({
    id: 'credentials',
    name: 'Email et mot de passe',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Mot de passe', type: 'password' },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (!user?.password_hash) return null;
      if (user.is_banned) return null;

      const valid = await verifyPassword(parsed.data.password, user.password_hash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatar_url,
        role: user.role,
        country: user.country,
        is_banned: user.is_banned,
      };
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  secret: env.AUTH_SECRET,
  pages: {
    signIn: '/connexion',
    error: '/connexion',
    newUser: '/tableau-de-bord',
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) token.id = user.id;

      // Recharge le profil a la connexion et lors d'une mise a jour explicite,
      // afin que le role, le pays et le bannissement restent a jour.
      if (user || trigger === 'update' || token.role === undefined) {
        const id = typeof token.id === 'string' ? token.id : token.sub;
        if (id) {
          const dbUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, avatar_url: true, role: true, country: true, is_banned: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.avatar_url;
            token.role = dbUser.role;
            token.country = dbUser.country;
            token.is_banned = dbUser.is_banned;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = typeof token.id === 'string' ? token.id : (token.sub ?? '');
      session.user.role = isRole(token.role) ? token.role : Role.BOTH;
      session.user.country = typeof token.country === 'string' ? token.country : 'BJ';
      session.user.is_banned = token.is_banned === true;
      return session;
    },
    authorized({ auth: session }) {
      return Boolean(session?.user && !session.user.is_banned);
    },
  },
  events: {
    async createUser({ user }) {
      // Les comptes Google arrivent sans pays ni role explicite : on applique
      // les valeurs par defaut du modele metier.
      if (!user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { email_verified: true, role: Role.BOTH },
      });
    },
  },
});
