'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_SEARCH_MIN_LENGTH,
  type ConversationSummary,
  type Message,
} from '@hirekiwi/contracts';
import { useMutation, useQuery, useQueryClient, useSmartApi } from '../api-provider';
import { Alert } from '../components/alert';
import { Button } from '../components/button';
import { ConfirmDialog } from '../components/confirm-dialog';
import { EmptyState, ErrorState, LoadingState } from '../components/common-states';
import { cn } from '../lib/cn';
import {
  MESSAGING_POLL_MS,
  MessageText,
  SnippetText,
  messageErrorText,
  newIdempotencyKey,
} from './messaging-utils';
import { ReportMessageDialog } from './report-message-dialog';

interface OutboxItem {
  readonly key: string;
  readonly body: string;
  readonly status: 'sending' | 'failed';
}

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const formatTime = (iso: string) => timeFormat.format(new Date(iso));

export interface MessagesWorkspaceProps {
  /** Open this conversation first (a `?conversation=` deep link or a notification). */
  initialConversationId?: string | null;
  /** Where blocked users are managed, if the app has a settings page for it. */
  blockedUsersHref?: string;
}

/** Th6-422/424/425/426/427 — conversation list, thread, composer, search, block and report. */
export function MessagesWorkspace({
  initialConversationId,
  blockedUsersHref,
}: MessagesWorkspaceProps) {
  const api = useSmartApi();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const me = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me(), retry: false });
  const conversations = useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: () => api.messaging.listConversations({ limit: 50 }),
    refetchInterval: MESSAGING_POLL_MS,
    retry: false,
  });
  const searching = debounced.length >= MESSAGE_SEARCH_MIN_LENGTH;
  const search = useQuery({
    queryKey: ['messaging', 'search', debounced],
    queryFn: () => api.messaging.search({ q: debounced, limit: 20 }),
    enabled: searching,
    retry: false,
  });

  const active = conversations.data?.conversations.find((c) => c.id === activeId) ?? null;

  const open = (conversationId: string, messageId: string | null = null) => {
    setActiveId(conversationId);
    setFocusMessageId(messageId);
  };

  return (
    <div className="grid h-[calc(100vh-12rem)] min-h-[520px] overflow-hidden rounded-md border border-zinc-200/80 bg-white font-sans shadow-2xs md:grid-cols-[minmax(0,320px)_1fr] dark:border-zinc-800 dark:bg-[#161616]">
      <aside
        className={cn(
          'min-h-0 flex-col border-zinc-200/80 md:border-r dark:border-zinc-800',
          activeId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="border-b border-zinc-100 p-3 dark:border-zinc-800">
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search your messages"
            aria-label="Search your messages"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {term.trim().length > 0 && !searching ? (
            <p className="px-3 pt-3 text-xs text-zinc-500">
              Type at least {MESSAGE_SEARCH_MIN_LENGTH} characters to search.
            </p>
          ) : null}
          {searching ? (
            <SearchResults
              loading={search.isLoading}
              error={search.error}
              onRetry={() => void search.refetch()}
              hits={search.data?.hits ?? []}
              onOpen={(hit) => open(hit.conversationId, hit.messageId)}
            />
          ) : (
            <ConversationList
              loading={conversations.isLoading}
              error={conversations.error}
              onRetry={() => void conversations.refetch()}
              items={conversations.data?.conversations ?? []}
              activeId={activeId}
              onOpen={(id) => open(id)}
            />
          )}
          {blockedUsersHref ? (
            <a href={blockedUsersHref} className="block px-4 py-3 text-xs text-zinc-500 underline">
              Blocked users
            </a>
          ) : null}
        </div>
      </aside>

      <section
        className={cn(
          'min-h-0 min-w-0',
          activeId
            ? 'flex flex-col'
            : 'hidden md:flex md:flex-col md:items-center md:justify-center',
        )}
      >
        {activeId && me.data ? (
          <Thread
            key={activeId}
            conversationId={activeId}
            summary={active}
            myId={me.data.userId}
            focusMessageId={focusMessageId}
            onBack={() => setActiveId(null)}
            onChanged={() => {
              void queryClient.invalidateQueries({ queryKey: ['messaging'] });
            }}
          />
        ) : (
          <EmptyState
            title="Select a conversation"
            description="Choose a conversation on the left to read and reply."
          />
        )}
      </section>
    </div>
  );
}

/* --------------------------------- list & search --------------------------------- */

function ConversationList(props: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  items: readonly ConversationSummary[];
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  if (props.loading) return <LoadingState message="Loading conversations…" />;
  if (props.error)
    return <ErrorState message={messageErrorText(props.error)} onRetry={props.onRetry} />;
  if (props.items.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="When someone messages you, or you message someone, it will show up here."
      />
    );
  }
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {props.items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => props.onOpen(item.id)}
            aria-current={item.id === props.activeId ? 'true' : undefined}
            className={cn(
              'relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              item.id === props.activeId &&
                'bg-zinc-100 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-zinc-900 dark:bg-zinc-800 dark:before:bg-white',
            )}
          >
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              {item.counterpart.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                  {item.counterpart.name}
                </span>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {formatTime(item.lastMessageAt)}
                </span>
              </span>
              {item.counterpart.orgName ? (
                <span className="block truncate text-xs text-zinc-500">
                  {item.counterpart.orgName}
                </span>
              ) : null}
              <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {item.lastMessage?.body ?? 'No messages yet'}
              </span>
            </span>
            {item.unreadCount > 0 ? (
              <span
                aria-label={`${item.unreadCount} unread`}
                className="mt-1 min-w-5 rounded-full bg-zinc-900 px-1.5 text-center text-[11px] leading-5 font-semibold text-white dark:bg-white dark:text-zinc-900"
              >
                {item.unreadCount}
              </span>
            ) : null}
            {item.muted ? <span className="text-[11px] text-neutral-400">Muted</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function SearchResults(props: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  hits: readonly {
    messageId: string;
    conversationId: string;
    snippet: string;
    counterpartName: string;
    createdAt: string;
  }[];
  onOpen: (hit: { messageId: string; conversationId: string }) => void;
}) {
  if (props.loading) return <LoadingState message="Searching…" />;
  if (props.error)
    return <ErrorState message={messageErrorText(props.error)} onRetry={props.onRetry} />;
  if (props.hits.length === 0) {
    return <EmptyState title="No messages found" description="Try different words." />;
  }
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {props.hits.map((hit) => (
        <li key={hit.messageId}>
          <button
            type="button"
            onClick={() => props.onOpen(hit)}
            className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <span className="flex justify-between gap-2 text-xs text-neutral-500">
              <span className="font-semibold">{hit.counterpartName}</span>
              <span>{formatTime(hit.createdAt)}</span>
            </span>
            <span className="mt-1 block text-xs">
              <SnippetText snippet={hit.snippet} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------- thread ------------------------------------- */

function Thread(props: {
  conversationId: string;
  summary: ConversationSummary | null;
  myId: string;
  focusMessageId: string | null;
  onBack: () => void;
  onChanged: () => void;
}) {
  const { conversationId, myId } = props;
  const api = useSmartApi();
  const queryClient = useQueryClient();
  const [older, setOlder] = useState<Message[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null | undefined>(undefined);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [draft, setDraft] = useState('');
  const [reporting, setReporting] = useState<Message | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLLIElement | null>(null);

  const latest = useQuery({
    queryKey: ['messaging', 'thread', conversationId],
    queryFn: () => api.messaging.listMessages(conversationId, { limit: 30 }),
    refetchInterval: MESSAGING_POLL_MS,
    retry: false,
  });

  const cursor = olderCursor === undefined ? (latest.data?.nextCursor ?? null) : olderCursor;

  const messages = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const m of [...older, ...(latest.data?.messages ?? [])]) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [older, latest.data]);

  const loadOlder = useCallback(async () => {
    if (!cursor || loadingOlder) return null;
    setLoadingOlder(true);
    setOlderError(null);
    try {
      const page = await api.messaging.listMessages(conversationId, { limit: 30, cursor });
      setOlder((current) => [...page.messages, ...current]);
      setOlderCursor(page.nextCursor);
      return page;
    } catch (error) {
      setOlderError(messageErrorText(error));
      return null;
    } finally {
      setLoadingOlder(false);
    }
  }, [api, conversationId, cursor, loadingOlder]);

  // Opening a thread, or a new message arriving while it is open, marks it read.
  const newest = messages.at(-1)?.id;
  const markRead = useMutation({
    mutationFn: () => api.messaging.markRead(conversationId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['messaging'] }),
  });
  useEffect(() => {
    if (newest) markRead.mutate();
  }, [conversationId, newest]);

  // A search result deep-links to one message: page back until it is loaded, then scroll to it.
  const focusId = props.focusMessageId;
  const focusLoaded = focusId ? messages.some((m) => m.id === focusId) : false;
  useEffect(() => {
    if (focusId && !focusLoaded && cursor && !loadingOlder && !olderError) void loadOlder();
  }, [focusId, focusLoaded, cursor, loadingOlder, olderError, loadOlder]);
  useEffect(() => {
    if (focusLoaded) focusRef.current?.scrollIntoView?.({ block: 'center' });
    else bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [focusLoaded, newest, outbox.length]);

  const sendNow = useMutation({
    mutationFn: (item: OutboxItem) =>
      api.messaging.send(conversationId, { body: item.body }, item.key),
    onSuccess: (_result, item) => {
      setOutbox((current) => current.filter((o) => o.key !== item.key));
      void queryClient.invalidateQueries({ queryKey: ['messaging'] });
    },
    onError: (_error, item) =>
      setOutbox((current) =>
        current.map((o) => (o.key === item.key ? { ...o, status: 'failed' } : o)),
      ),
  });

  const submit = () => {
    const body = draft.trim();
    if (!body || body.length > MESSAGE_MAX_LENGTH) return;
    const item: OutboxItem = { key: newIdempotencyKey(), body, status: 'sending' };
    setOutbox((current) => [...current, item]);
    setDraft('');
    sendNow.mutate(item);
  };
  // The same key is reused, so a retry after a timeout cannot create a second message.
  const retry = (item: OutboxItem) => {
    setOutbox((current) =>
      current.map((o) => (o.key === item.key ? { ...o, status: 'sending' } : o)),
    );
    sendNow.mutate(item);
  };

  const mute = useMutation({
    mutationFn: (muted: boolean) => api.messaging.setMuted(conversationId, muted),
    onSuccess: props.onChanged,
    onError: (e) => setActionError(messageErrorText(e)),
  });
  const block = useMutation({
    mutationFn: (userId: string) => api.messaging.block(userId),
    onSuccess: () => {
      setConfirmBlock(false);
      props.onBack();
      props.onChanged();
    },
    onError: (e) => setActionError(messageErrorText(e)),
  });
  const remove = useMutation({
    mutationFn: (messageId: string) => api.messaging.deleteMessage(conversationId, messageId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['messaging'] }),
    onError: (e) => setActionError(messageErrorText(e)),
  });

  const counterpart = props.summary?.counterpart;
  const canSend = props.summary?.canSend ?? true;

  if (latest.isLoading) return <LoadingState message="Loading messages…" />;
  if (latest.error) {
    return (
      <ErrorState message={messageErrorText(latest.error)} onRetry={() => void latest.refetch()} />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={props.onBack}
          className="rounded-md p-1 text-sm text-zinc-500 hover:bg-zinc-100 md:hidden"
          aria-label="Back to conversations"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
            {counterpart?.name ?? 'Conversation'}
          </p>
          {counterpart?.orgName ? (
            <p className="truncate text-xs text-zinc-500">{counterpart.orgName}</p>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => mute.mutate(!props.summary?.muted)}
          disabled={mute.isPending}
        >
          {props.summary?.muted ? 'Unmute' : 'Mute'}
        </Button>
        {counterpart ? (
          <Button size="sm" variant="ghost" onClick={() => setConfirmBlock(true)}>
            Block
          </Button>
        ) : null}
      </header>

      {actionError ? (
        <Alert tone="danger" className="m-3">
          {actionError}
        </Alert>
      ) : null}

      <ul
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-zinc-50/50 px-4 py-4 dark:bg-transparent"
        aria-label="Messages"
      >
        {cursor ? (
          <li className="text-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadOlder()}
              disabled={loadingOlder}
            >
              {loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </Button>
            {olderError ? (
              <span role="alert" className="ml-2 text-xs text-red-600">
                {olderError}
              </span>
            ) : null}
          </li>
        ) : null}
        {messages.length === 0 && outbox.length === 0 ? (
          <li className="py-10 text-center text-sm text-zinc-500">No messages yet. Say hello.</li>
        ) : null}
        {messages.map((m) => {
          const mine = m.senderId === myId;
          return (
            <li
              key={m.id}
              ref={m.id === focusId ? focusRef : undefined}
              className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'max-w-[75%] px-3.5 py-2 text-sm leading-relaxed shadow-2xs',
                  mine
                    ? 'rounded-2xl rounded-br-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'rounded-2xl rounded-bl-md border border-zinc-200/80 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100',
                  m.id === focusId && 'ring-2 ring-yellow-400',
                )}
              >
                {m.deleted ? (
                  <em className="opacity-70">This message was deleted.</em>
                ) : (
                  <MessageText text={m.body} />
                )}
              </div>
              <div className="mt-1 flex gap-2 px-1 text-[11px] text-zinc-400">
                <span>{formatTime(m.createdAt)}</span>
                {!m.deleted && mine ? (
                  <button type="button" className="underline" onClick={() => remove.mutate(m.id)}>
                    Delete
                  </button>
                ) : null}
                {!m.deleted && !mine ? (
                  <button type="button" className="underline" onClick={() => setReporting(m)}>
                    Report
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
        {outbox.map((item) => (
          <li key={item.key} className="flex flex-col items-end">
            <div className="max-w-[75%] rounded-2xl rounded-br-md bg-zinc-900/60 px-3.5 py-2 text-sm leading-relaxed text-white dark:bg-white/60 dark:text-zinc-900">
              <MessageText text={item.body} />
            </div>
            <div className="mt-1 flex gap-2 px-1 text-[11px]">
              {item.status === 'sending' ? (
                <span className="text-neutral-500">Sending…</span>
              ) : (
                <>
                  <span className="text-red-600">Not delivered</span>
                  <button type="button" className="underline" onClick={() => retry(item)}>
                    Retry
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      setOutbox((current) => current.filter((o) => o.key !== item.key))
                    }
                  >
                    Discard
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>

      {canSend ? (
        <form
          className="border-t border-zinc-100 p-3 dark:border-zinc-800"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            aria-label="Write a message"
            placeholder="Write a message…"
            className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="mt-2 flex items-center justify-between">
            <span
              className={cn(
                'text-xs',
                draft.length > MESSAGE_MAX_LENGTH ? 'text-red-600' : 'text-zinc-400',
              )}
            >
              {draft.length}/{MESSAGE_MAX_LENGTH}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!draft.trim() || draft.length > MESSAGE_MAX_LENGTH}
            >
              Send
            </Button>
          </div>
        </form>
      ) : (
        <Alert tone="warning" className="m-3">
          You can&apos;t message this user.
        </Alert>
      )}

      <ReportMessageDialog
        message={reporting}
        onClose={() => setReporting(null)}
        onReported={() => setReporting(null)}
      />
      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={() => counterpart && block.mutate(counterpart.userId)}
        title={`Block ${counterpart?.name ?? 'this user'}?`}
        description="Neither of you will be able to send new messages, and this conversation will be hidden from your list. You can unblock them later."
        confirmText="Block"
        isLoading={block.isPending}
        error={block.error ? messageErrorText(block.error) : null}
      />
    </div>
  );
}
