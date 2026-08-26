import { NextResponse, type NextRequest } from 'next/server';

/**
 * Protection des espaces authentifies.
 *
 * Le middleware s'execute sur l'edge : il ne verifie que la presence du cookie
 * de session (pas sa validite cryptographique, qui necessiterait Node.js).
 * L'autorisation reelle est faite dans chaque page et route API via
 * `requireUser()` / `requireAdmin()` — ceci n'est qu'une redirection de confort.
 */
const PROTECTED_PREFIXES = ['/tableau-de-bord', '/vendre', '/admin'];

const SESSION_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/connexion', request.url);
  loginUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/tableau-de-bord/:path*', '/vendre/:path*', '/admin/:path*'],
};
