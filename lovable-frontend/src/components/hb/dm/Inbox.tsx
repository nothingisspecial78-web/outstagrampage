import { Link, useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  Info,
  Phone,
  Video,
  Heart,
  Smile,
  Pencil,
  Search,
  SendHorizontal,
  PhoneIncoming,
  PhoneMissed,
} from "lucide-react";
import { Avatar } from "@/components/hb/AppShell";
import { EnvelopeLock } from "@/components/hb/EnvelopeLock";
import { CodeSheet } from "@/components/hb/CodeSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ME, PEOPLE, searchPeople, type Person } from "@/lib/people";
import { useStore, type Chat } from "@/lib/store";
import { useCall } from "@/lib/call/CallContext";
import { VoiceRecorder } from "@/components/hb/dm/VoiceRecorder";
import { AudioMessagePlayer } from "@/components/hb/dm/AudioMessagePlayer";
import { cn } from "@/lib/utils";

function personFor(name: string) {
  return [...PEOPLE, ...searchPeople("")].find(
    (p) => p.name.split(" ")[0]?.toLowerCase() === name.split(" ")[0]?.toLowerCase()
  );
}

function Face({ name, size = "size-11" }: { name: string; size?: string }) {
  const person = personFor(name);
  return person ? (
    <Avatar src={person.avatar} size={size} />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-sand bg-line font-semibold text-ink",
        size
      )}
    >
      {name.charAt(0) || "?"}
    </span>
  );
}

function Thread({ chat, active }: { chat: Chat; active: boolean }) {
  const last = chat.messages.at(-1);
  const count = chat.messages.length;
  return (
    <Link
      to="/chats/$id"
      params={{ id: chat.id }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper",
        active && "bg-paper"
      )}
    >
      <span className="relative">
        <Face name={chat.name} size="size-12" />
        {["maya", "priya"].includes(chat.id) && (
          <i className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-paper-raised bg-moss" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex justify-between gap-2">
          <b className="truncate text-sm text-ink">{chat.name}</b>
          <small className="shrink-0 text-xs text-ink-muted">{count ? "2h" : "1d"}</small>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-ink-muted">
            {last?.audioUrl ? "🎤 Voice message" : last?.text ?? "Start a conversation"}
          </span>
          {count % 2 === 0 && <i className="size-2 shrink-0 rounded-full bg-link" />}
        </span>
      </span>
      <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-[10px] font-semibold tabular-nums text-stamp-ink">
        {count}/{chat.limit}
      </span>
    </Link>
  );
}

function PersonRow({ p, onPick }: { p: Person; onPick: (p: Person) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(p)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-paper"
    >
      <img src={p.avatar} alt="" className="size-10 rounded-full object-cover" />
      <span className="min-w-0">
        <b className="block truncate text-sm text-ink">{p.name}</b>
        <small className="text-xs text-ink-muted">@{p.handle}</small>
      </span>
    </button>
  );
}

function ThreadList({ selected }: { selected: string | undefined }) {
  const { chats, session, startChat } = useStore();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState(false);
  const [pq, setPq] = useState("");

  const open = (p: Person) => {
    const id = startChat(p.name);
    setPicker(false);
    setQuery("");
    nav({ to: "/chats/$id", params: { id } });
  };

  const chatIds = new Set(chats.map((c) => c.id));
  const newPeople = query.trim()
    ? searchPeople(query).filter((p) => !chatIds.has(p.name.split(" ")[0]!.toLowerCase()))
    : [];
  const handle = session?.name || ME.handle;
  const filtered = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.messages.at(-1)?.text?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside
      className={cn(
        "w-full border-r border-sand bg-paper-raised md:w-[360px] md:shrink-0",
        selected && "hidden md:block"
      )}
    >
      <div className="border-b border-sand px-5 pt-6 pb-4">
        <div className="mb-5 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xl font-bold text-ink">
            {handle}
            <ChevronDown className="size-4" />
          </button>
          <button
            aria-label="New message"
            onClick={() => setPicker(true)}
            className="rounded-full p-2 text-ink hover:bg-line"
          >
            <Pencil className="size-5" />
          </button>
        </div>
        <label className="relative block">
          <Search className="absolute top-2.5 left-3 size-4 text-ink-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-9 rounded-lg border-0 bg-line pl-9 shadow-none"
          />
        </label>
        <div className="mt-5 flex items-center justify-between">
          <b className="text-sm text-ink">Messages</b>
          <span className="text-xs font-medium text-ink-muted">Requests</span>
        </div>
      </div>
      <div className="py-1">
        {filtered.map((c) => (
          <Thread key={c.id} chat={c} active={selected === c.id} />
        ))}
        {newPeople.length > 0 && (
          <>
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-ink-muted">Start a new chat</p>
            {newPeople.map((p) => (
              <PersonRow key={p.handle} p={p} onPick={open} />
            ))}
          </>
        )}
        {!filtered.length && !newPeople.length && (
          <p className="p-6 text-sm text-ink-muted">No conversations found.</p>
        )}
      </div>
      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>New message</DialogTitle>
          </DialogHeader>
          <div className="px-4">
            <Input
              autoFocus
              value={pq}
              onChange={(e) => setPq(e.target.value)}
              placeholder="Name, handle or friend code"
            />
          </div>
          <div className="max-h-80 overflow-y-auto pb-3">
            {searchPeople(pq).map((p) => (
              <PersonRow key={p.handle} p={p} onPick={open} />
            ))}
            {!searchPeople(pq).length && (
              <p className="p-4 text-sm text-ink-muted">Nobody found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function Conversation({ chat }: { chat: Chat }) {
  const { send, sendVoice } = useStore();
  const { startCall } = useCall();
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const locked = chat.messages.length >= chat.limit;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  const person = personFor(chat.name);

  const initiateCall = (type: "voice" | "video") => {
    startCall(
      chat.id,
      {
        id: chat.id,
        name: chat.name,
        avatar: person?.avatar || "",
      },
      type
    );
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-paper-raised">
      <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-sand px-4">
        <Link to="/chats" className="md:hidden" aria-label="Back to messages">
          <ArrowLeft className="size-5" />
        </Link>
        <Face name={chat.name} size="size-10" />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm text-ink">{chat.name}</b>
          <small className="text-xs text-ink-muted">Active now</small>
        </div>
        <div className="flex items-center gap-1 text-ink">
          {/* Voice Call Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => initiateCall("voice")}
            aria-label={`Voice call ${chat.name}`}
            className="hover:bg-sand/30 hover:text-stamp-ink"
          >
            <Phone className="size-5" />
          </Button>

          {/* Video Call Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => initiateCall("video")}
            aria-label={`Video call ${chat.name}`}
            className="hover:bg-sand/30 hover:text-stamp-ink"
          >
            <Video className="size-5" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Conversation info">
            <Info className="size-5" />
          </Button>
        </div>
      </header>

      {/* Message List */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 md:px-8">
        {chat.messages.length > 3 && (
          <div className="py-3 text-center">
            <span className="rounded-full bg-line px-3 py-1 text-xs text-ink-muted">Today</span>
          </div>
        )}
        {chat.messages.map((m, i) => (
          <div key={m.id} className="contents">
            {i === Math.floor(chat.messages.length / 2) && chat.messages.length > 5 && (
              <div className="py-4 text-center text-xs text-ink-muted">Today · 2:14 PM</div>
            )}

            {m.callRecord ? (
              /* Call Event Marker */
              <div className="my-2.5 flex justify-center">
                <div className="flex items-center gap-1.5 rounded-full border border-sand/60 bg-line/80 px-3 py-1 text-xs text-ink-muted shadow-sm">
                  {m.callRecord.status === "declined" ? (
                    <PhoneMissed className="size-3.5 text-rose-500" />
                  ) : (
                    <PhoneIncoming className="size-3.5 text-emerald-600" />
                  )}
                  <span>{m.text}</span>
                </div>
              </div>
            ) : m.audioUrl ? (
              /* Voice Note Bubble */
              <div className={cn("mb-2 flex", m.mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm shadow-sm",
                    m.mine
                      ? "rounded-br-md bg-stamp text-primary-foreground"
                      : "rounded-bl-md bg-line text-ink"
                  )}
                >
                  <AudioMessagePlayer
                    audioUrl={m.audioUrl}
                    duration={m.audioDuration}
                    mine={m.mine}
                  />
                </div>
              </div>
            ) : (
              /* Regular Text Bubble */
              <div className={cn("mb-2 flex", m.mine ? "justify-end" : "justify-start")}>
                <p
                  className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm",
                    m.mine
                      ? "rounded-br-md bg-stamp text-primary-foreground"
                      : "rounded-bl-md bg-line text-ink"
                  )}
                >
                  {m.text}
                </p>
              </div>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>

      {/* Input Bar / Envelope Lock */}
      <div className="shrink-0 border-t border-sand p-3 md:px-5">
        {locked ? (
          <div className="mx-auto max-w-lg">
            <div className="mb-3 flex justify-center">
              <span className="rounded-full bg-stamp-soft px-3 py-1 text-xs font-medium text-stamp-ink">
                {chat.messages.length} of {chat.limit}
              </span>
            </div>
            <EnvelopeLock name={chat.name} />
            <div className="mt-3 flex justify-center">
              <Button onClick={() => setSheet(true)}>We're together</Button>
            </div>
            <p className="mt-2 text-center text-sm">
              <Link to="/meet" className="text-link underline">
                Enter their code on Meet
              </Link>
            </p>
          </div>
        ) : (
          <form
            className="flex items-center gap-2 rounded-full border border-sand px-3 py-1.5 bg-paper"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) {
                send(chat.id, text.trim());
                setText("");
              }
            }}
          >
            <button type="button" aria-label="Emoji" className="text-ink hover:text-stamp-ink">
              <Smile className="size-5" />
            </button>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message…"
              className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <button type="button" aria-label="Add image" className="text-ink hover:text-stamp-ink">
              <ImageIcon className="size-5" />
            </button>

            {/* Voice Recorder button & Live Bar */}
            <VoiceRecorder
              onSend={(audioUrl, duration) => {
                sendVoice(chat.id, audioUrl, duration);
              }}
            />

            {text.trim() ? (
              <button type="submit" className="px-1 text-sm font-semibold text-link">
                Send
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send a heart"
                className="text-ink hover:text-rose-500"
                onClick={() => send(chat.id, "❤️")}
              >
                <Heart className="size-5" />
              </button>
            )}
          </form>
        )}
      </div>
      <CodeSheet open={sheet} onOpenChange={setSheet} name={chat.name} />
    </section>
  );
}

export function Inbox({ chatId }: { chatId?: string }) {
  const { chats } = useStore();
  const chat = chatId ? chats.find((c) => c.id === chatId) : undefined;

  if (chatId && !chat)
    return (
      <div className="grid min-h-[60vh] flex-1 place-items-center p-6 text-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Chat not found</h1>
          <p className="mt-2 text-ink-muted">This conversation may have wandered off.</p>
          <Button asChild className="mt-4">
            <Link to="/chats">Back to messages</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem)] w-full max-w-[960px] overflow-hidden border-x border-sand bg-paper-raised md:my-6 md:rounded-xl md:border md:shadow-postcard">
      <ThreadList selected={chatId} />
      {chat ? (
        <Conversation chat={chat} />
      ) : (
        <section className="hidden flex-1 flex-col items-center justify-center text-center md:flex">
          <span className="mb-4 grid size-24 place-items-center rounded-full border-2 border-ink">
            <SendHorizontal className="size-10 text-ink" />
          </span>
          <h1 className="font-serif text-2xl font-semibold text-ink">Your messages</h1>
          <p className="mt-2 text-sm text-ink-muted">Send private messages to a friend.</p>
          <Button
            className="mt-5"
            onClick={() => {
              const first = chats[0];
              if (first) window.location.href = `/chats/${first.id}`;
            }}
          >
            Send message
          </Button>
        </section>
      )}
    </div>
  );
}
