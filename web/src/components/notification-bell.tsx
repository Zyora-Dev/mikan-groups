"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Mail, MailWarning } from "lucide-react";
import { type AppNotification, api } from "@/lib/api";
import { relativeTime } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const panel = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const { unread: n } = await api.notifications.count();
      setUnread(n);
    } catch { /* offline or signed out */ }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    api.notifications.list().then(setItems).catch(() => {});

    function onClick(e: MouseEvent) {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(n: AppNotification) {
    if (!n.read_at) {
      await api.notifications.markRead(n.id).catch(() => {});
      void refresh();
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function readAll() {
    await api.notifications.markAllRead().catch(() => {});
    setItems((list) => list.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    setUnread(0);
  }

  return (
    <div className="relative" ref={panel}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-lg transition-colors",
          open ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white"
        )}>
        <Bell className="size-4.5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-[1.1rem] items-center justify-center rounded-full bg-brand-ember px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <p className="text-sm font-bold text-white">Notifications</p>
            {unread > 0 && (
              <button onClick={readAll}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto size-6 text-white/20" />
              <p className="mt-3 text-sm font-medium text-white/45">Nothing yet</p>
            </div>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-white/[0.07] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => openItem(n)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04]",
                      !n.read_at && "bg-brand-green/[0.04]"
                    )}>
                    <span className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.read_at ? "bg-transparent" : "bg-brand-green"
                    )} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold leading-snug text-white">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="mt-1 line-clamp-2 block text-xs font-medium leading-relaxed text-white/60">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-white/40">
                        {relativeTime(n.created_at)}
                        {n.emailed_at
                          ? <Mail className="size-3" aria-label="Emailed" />
                          : <MailWarning className="size-3 opacity-40" aria-label="Not emailed" />}
                      </span>
                    </span>
                    {!n.read_at && <Check className="mt-1 size-3.5 shrink-0 text-white/20" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
