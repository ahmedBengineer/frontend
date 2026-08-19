"use client";

import {
  type TrackReferenceOrPlaceholder,
  useChat,
  useLocalParticipant,
  useTrackTranscription,
} from "@livekit/components-react";
import { Send } from "lucide-react";
import { Track, type TranscriptionSegment } from "livekit-client";
import React from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const MAX_CHAT_LENGTH = 2000;

interface TranscriptMessage {
  id: string;
  text: string;
  speaker: "Agent" | "You";
  isSelf: boolean;
  timestamp: number;
  final: boolean;
}

function timestampFor(id: string, timestamps: Map<string, number>): number {
  const existing = timestamps.get(id);
  if (existing) return existing;
  const value = Date.now();
  timestamps.set(id, value);
  return value;
}

function messagesFromSegments(
  segments: TranscriptionSegment[],
  speaker: "Agent" | "You",
  timestamps: Map<string, number>,
): TranscriptMessage[] {
  return segments.map((segment) => ({
    id: `${speaker}:${segment.id}`,
    text: segment.text,
    speaker,
    isSelf: speaker === "You",
    timestamp: timestampFor(`${speaker}:${segment.id}`, timestamps),
    final: segment.final,
  }));
}

export function Transcript({
  agentAudioTrack,
}: {
  agentAudioTrack?: TrackReferenceOrPlaceholder;
}) {
  const agent = useTrackTranscription(agentAudioTrack);
  const { localParticipant } = useLocalParticipant();
  const { chatMessages, send } = useChat();
  const local = useTrackTranscription({
    publication: localParticipant.getTrackPublication(Track.Source.Microphone),
    source: Track.Source.Microphone,
    participant: localParticipant,
  });
  const timestamps = useRef(new Map<string, number>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messages = useMemo(
    () =>
      [
        ...messagesFromSegments(agent.segments, "Agent", timestamps.current),
        ...messagesFromSegments(local.segments, "You", timestamps.current),
        ...chatMessages.map((message, index): TranscriptMessage => {
          const isSelf = message.from?.identity === localParticipant.identity;
          return {
            id: `chat:${message.timestamp}:${message.from?.identity ?? "unknown"}:${index}`,
            text: message.message,
            speaker: isSelf ? "You" : "Agent",
            isSelf,
            timestamp: message.timestamp,
            final: true,
          };
        }),
      ].sort((left, right) => left.timestamp - right.timestamp),
    [agent.segments, chatMessages, local.segments, localParticipant.identity],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (container && pinnedToBottom.current)
      container.scrollTop = container.scrollHeight;
  }, [messages]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await send(message);
      setDraft("");
      pinnedToBottom.current = true;
    } catch {
      setSendError("The message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
        aria-live="polite"
        data-testid="transcript-scroll-region"
        ref={scrollRef}
        onScroll={(event) => {
          const target = event.currentTarget;
          pinnedToBottom.current =
            target.scrollHeight - target.scrollTop - target.clientHeight < 48;
        }}
      >
        {messages.length ? (
          messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.isSelf ? "ml-auto bg-cyan-500 text-slate-950" : "mr-auto bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}
            >
              <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide opacity-60">
                {message.speaker}
              </span>
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {message.text}
                {message.final ? "" : " …"}
              </p>
            </article>
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
            Speak or type a message to begin.
          </div>
        )}
      </div>
      <form
        className="flex shrink-0 gap-2 border-t p-3 dark:border-slate-800"
        onSubmit={submitMessage}
      >
        <label className="sr-only" htmlFor="call-message">
          Message the agent
        </label>
        <input
          autoComplete="off"
          id="call-message"
          maxLength={MAX_CHAT_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message"
          value={draft}
          className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/50"
        />
        <button
          aria-label="Send message"
          disabled={!draft.trim() || sending}
          title="Send message"
          type="submit"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {sendError && (
        <div className="shrink-0 px-3 pb-2 text-xs text-red-600" role="alert">
          {sendError}
        </div>
      )}
    </div>
  );
}
