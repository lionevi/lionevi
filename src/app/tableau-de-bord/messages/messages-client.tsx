'use client';

import { AlertTriangle, Loader2, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRealtime } from '@/lib/realtime';
import { cn, formatRelative, initials, truncate } from '@/lib/utils';

interface ConversationItem {
  peer: { id: string; name: string; avatar_url: string | null };
  last_message: { content: string; created_at: string; from_me: boolean };
  unread_count: number;
}

interface MessageItem {
  id: string;
  content: string;
  sender_id: string;
  is_blocked: boolean;
  created_at: string;
}

interface MessagesClientProps {
  userId: string;
  conversations: ConversationItem[];
  activePeer: { id: string; name: string; avatar_url: string | null } | null;
  initialMessages: MessageItem[];
}

/** Messagerie : liste des conversations et fil actif, rafraichis en direct. */
export function MessagesClient({
  userId,
  conversations,
  activePeer,
  initialMessages,
}: MessagesClientProps): React.JSX.Element {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const refresh = useCallback(async () => {
    if (!activePeer) {
      router.refresh();
      return;
    }
    try {
      const response = await fetch(`/api/messages?avec=${activePeer.id}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { messages: MessageItem[] };
      setMessages(data.messages);
      router.refresh();
    } catch {
      // Silencieux : le fil affiche reste le dernier connu.
    }
  }, [activePeer, router]);

  useRealtime({
    table: 'Message',
    filter: `receiver_id=eq.${userId}`,
    onChange: () => void refresh(),
  });

  async function send(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!activePeer || !content.trim()) return;

    setError(null);
    setBlockedNotice(null);
    setSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: activePeer.id, content: content.trim() }),
      });

      const data = (await response.json()) as {
        error?: string;
        blocked?: boolean;
        reason?: string | null;
      };

      if (!response.ok) {
        setError(data.error ?? "Le message n'a pas pu etre envoye.");
        return;
      }

      if (data.blocked) {
        setBlockedNotice(data.reason ?? 'Ce message a ete bloque par la moderation.');
      }

      setContent('');
      await refresh();
    } catch {
      setError('Impossible de contacter le serveur. Reessayez.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Conversations */}
      <div className="rounded-xl border border-border bg-card">
        {conversations.length > 0 ? (
          <ul className="divide-y divide-border">
            {conversations.map((conversation) => (
              <li key={conversation.peer.id}>
                <Link
                  href={`/tableau-de-bord/messages?avec=${conversation.peer.id}`}
                  className={cn(
                    'flex items-start gap-3 p-3.5 transition-colors hover:bg-muted',
                    activePeer?.id === conversation.peer.id && 'bg-primary/5',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/25 text-xs font-bold text-secondary-700">
                    {initials(conversation.peer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {conversation.peer.name}
                      </span>
                      {conversation.unread_count > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {conversation.unread_count}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {conversation.last_message.from_me && 'Vous : '}
                      {truncate(conversation.last_message.content, 40)}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {formatRelative(conversation.last_message.created_at)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Aucune conversation. Contactez un vendeur depuis la fiche de son projet.
          </p>
        )}
      </div>

      {/* Fil actif */}
      <div className="flex min-h-[480px] flex-col rounded-xl border border-border bg-card">
        {activePeer ? (
          <>
            <div className="flex items-center gap-3 border-b border-border p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/25 text-xs font-bold text-secondary-700">
                {initials(activePeer.name)}
              </span>
              <p className="font-semibold">{activePeer.name}</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Demarrez la conversation.
                </p>
              )}

              {messages.map((message) => {
                const fromMe = message.sender_id === userId;
                return (
                  <div
                    key={message.id}
                    className={cn('flex', fromMe ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        fromMe
                          ? message.is_blocked
                            ? 'bg-error/10 text-error ring-1 ring-error/30'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      {message.is_blocked && fromMe && (
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          Bloque par la moderation — non remis
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span
                        className={cn(
                          'mt-1 block text-[11px]',
                          fromMe && !message.is_blocked
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground',
                        )}
                      >
                        {formatRelative(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="border-t border-border p-4">
              {error && (
                <Alert variant="error" className="mb-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {blockedNotice && (
                <Alert variant="warning" className="mb-3">
                  <AlertDescription>{blockedNotice}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Ecrire un message..."
                  rows={2}
                  className="min-h-11 resize-none"
                  aria-label="Votre message"
                />
                <Button type="submit" disabled={sending || !content.trim()}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only sm:not-sr-only">Envoyer</span>
                </Button>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Les coordonnees directes et les propositions de paiement hors plateforme sont
                automatiquement bloquees.
              </p>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="Selectionnez une conversation"
              description="Choisissez un interlocuteur a gauche, ou contactez un vendeur depuis la fiche de son projet."
            />
          </div>
        )}
      </div>
    </div>
  );
}
