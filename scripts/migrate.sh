#!/usr/bin/env bash
#
# Applique les migrations Prisma puis regenere le client.
#
# Usage :
#   ./scripts/migrate.sh
#
# Sur Vercel, ce script s'utilise comme etape de deploiement (par exemple en
# tete de la Build Command, ou depuis un job CI declenche apres le deploiement) :
#   bash scripts/migrate.sh && npm run build
#
# Prerequis :
#   - DATABASE_URL : connexion applicative (pooler Supabase).
#   - DIRECT_URL   : connexion directe. `prisma migrate deploy` ouvre une
#                    transaction longue et des connexions consultatives que le
#                    pooler en mode transaction ne supporte pas : sans cette
#                    variable, la migration echoue sur Supabase.
#
# Le script est volontairement strict : toute erreur interrompt le deploiement
# plutot que de laisser partir une application dont le schema ne correspond pas
# a la base.

set -euo pipefail

echo "==> Verification de l'environnement"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERREUR : DATABASE_URL n'est pas defini." >&2
  exit 1
fi

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "AVERTISSEMENT : DIRECT_URL n'est pas defini." >&2
  echo "  Sur Supabase, 'prisma migrate deploy' echouera a travers le pooler." >&2
  echo "  Definissez DIRECT_URL avec la connexion directe (port 5432)." >&2
fi

echo "==> Application des migrations (prisma migrate deploy)"
npx prisma migrate deploy

echo "==> Generation du client Prisma (prisma generate)"
npx prisma generate

echo "==> Migrations appliquees et client genere."
