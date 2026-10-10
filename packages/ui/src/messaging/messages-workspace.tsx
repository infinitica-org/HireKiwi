'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_SEARCH_MIN_LENGTH,
  type ConversationSummary,
  type Message,
} from '@hirekiwi/contracts';
import { useMutation, useQuery, useQueryClient, useHireKiwiApi } from '../api-provider';
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

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const formatClock = (iso: string) => clockFormat.format(new Date(iso));
const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dayKey = (iso: string) => new Date(iso).toDateString();
const formatDay = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return dayFormat.format(date);
};
const initialsOf = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase() || '?';

/** A round avatar: the person's photo or logo when there is one, otherwise their initials. */
function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold tracking-wide',
        showImage
          ? 'border border-zinc-200 bg-white dark:border-zinc-700'
          : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900',
        className ?? 'size-11',
      )}
    >
      {showImage ? (
        <img
          src={src as string}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export interface MessagesWorkspaceProps {
  /** Open this conversation first (a `?conversation=` deep link or a notification). */
  initialConversationId?: string | null;
  /** Where blocked users are managed, if the app has a settings page for it. */
  blockedUsersHref?: string;
  /** Fill the space it is placed in, edge to edge, instead of sitting in a bordered card. */
  fullScreen?: boolean;
}

/** Th6-422/424/425/426/427 — conversation list, thread, composer, search, block and report. */
export function MessagesWorkspace({
  initialConversationId,
  blockedUsersHref,
  fullScreen = false,
}: MessagesWorkspaceProps) {
  const api = useHireKiwiApi();
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
    <div
      className={cn(
        'grid overflow-hidden bg-white font-sans md:grid-cols-[minmax(0,380px)_1fr] dark:bg-[#161616]',
        fullScreen
          ? 'h-full min-h-0'
          : 'h-[calc(100vh-12rem)] min-h-[520px] rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800',
      )}
    >
      <aside
        className={cn(
          'min-h-0 flex-col border-zinc-200 bg-zinc-50/40 md:border-r dark:border-zinc-800 dark:bg-transparent',
          activeId ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="p-4 pb-2">
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search your messages"
            aria-label="Search your messages"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
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
        {activeId && me.isPending ? (
          <LoadingState message="Opening conversation…" />
        ) : activeId && me.isError ? (
          <ErrorState message={messageErrorText(me.error)} onRetry={() => void me.refetch()} />
        ) : activeId && me.data ? (
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
    <ul className="space-y-0.5 px-2 pb-2">
      {props.items.map((item) => {
        const unread = item.unreadCount > 0;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => props.onOpen(item.id)}
              aria-current={item.id === props.activeId ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-white dark:hover:bg-zinc-800/50',
                item.id === props.activeId &&
                  'bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700',
              )}
            >
              <Avatar name={item.counterpart.name} src={item.counterpart.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm text-zinc-950 dark:text-white',
                      unread ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {item.counterpart.name}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[11px]',
                      unread ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-400',
                    )}
                  >
                    {formatClock(item.lastMessageAt)}
                  </span>
                </span>
                {item.counterpart.orgName ? (
                  <span className="block truncate text-[11px] text-zinc-400">
                    {item.counterpart.orgName}
                  </span>
                ) : null}
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'block truncate text-[13px]',
                      unread
                        ? 'font-medium text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400',
                    )}
                  >
                    {item.lastMessage?.body ?? 'No messages yet'}
                  </span>
                  {unread ? (
                    <span
                      aria-label={`${item.unreadCount} unread`}
                      className="min-w-5 shrink-0 rounded-full bg-zinc-900 px-1.5 text-center text-[11px] leading-5 font-semibold text-white dark:bg-white dark:text-zinc-900"
                    >
                      {item.unreadCount}
                    </span>
                  ) : item.muted ? (
                    <span className="shrink-0 text-[11px] text-neutral-400">Muted</span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
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
  const api = useHireKiwiApi();
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
      <header className="flex items-center gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={props.onBack}
          className="rounded-md p-1 text-sm text-zinc-500 hover:bg-zinc-100 md:hidden"
          aria-label="Back to conversations"
        >
          ←
        </button>
        <Avatar
          name={counterpart?.name ?? 'Conversation'}
          src={counterpart?.avatarUrl}
          className="size-10"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-zinc-950 dark:text-white">
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
        className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-zinc-50 px-5 py-5 dark:bg-transparent"
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
        {messages.map((m, index) => {
          const mine = m.senderId === myId;
          const previous = messages[index - 1];
          const newDay = !previous || dayKey(previous.createdAt) !== dayKey(m.createdAt);
          return (
            <li
              key={m.id}
              ref={m.id === focusId ? focusRef : undefined}
              className={cn('group flex flex-col', mine ? 'items-end' : 'items-start')}
            >
              {newDay ? (
                <span className="mx-auto mb-3 mt-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  {formatDay(m.createdAt)}
                </span>
              ) : null}
              <div
                className={cn(
                  'max-w-[75%] px-3.5 py-2 text-sm leading-relaxed shadow-2xs',
                  mine
                    ? 'rounded-2xl rounded-br-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'rounded-2xl rounded-bl-md border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100',
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
                <span>{formatClock(m.createdAt)}</span>
                {!m.deleted && mine ? (
                  <button
                    type="button"
                    className="underline opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => remove.mutate(m.id)}
                  >
                    Delete
                  </button>
                ) : null}
                {!m.deleted && !mine ? (
                  <button
                    type="button"
                    className="underline opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => setReporting(m)}
                  >
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
          className="shrink-0 border-t border-zinc-200 bg-white px-4 pt-3 pb-4 dark:border-zinc-800 dark:bg-transparent"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1.5 pl-4 pr-1.5 focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={1}
              aria-label="Write a message"
              placeholder="Write a message…"
              className="block max-h-32 min-h-[24px] flex-1 resize-none self-center bg-transparent py-0 text-sm leading-6 outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || draft.length > MESSAGE_MAX_LENGTH}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                <path d="M22 2 11 13" />
              </svg>
              Send
            </button>
          </div>
          {draft.length > MESSAGE_MAX_LENGTH * 0.8 ? (
            <p
              className={cn(
                'mt-1.5 px-1 text-right text-xs',
                draft.length > MESSAGE_MAX_LENGTH ? 'text-red-600' : 'text-zinc-400',
              )}
            >
              {draft.length}/{MESSAGE_MAX_LENGTH}
            </p>
          ) : null}
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
