"use client";

import { useEffect, useState } from "react";
import {
  Building2, Clock, Loader2, Mail, MessageSquare, Phone, ShieldCheck,
} from "lucide-react";
import { type Session, api } from "@/lib/api";
import { site } from "@/lib/site";

const HOW_IT_WORKS = [
  {
    title: "Work is issued to you",
    body: "When the team finishes an item they submit it. It appears under \"Needs your decision\" and you'll get a notification.",
  },
  {
    title: "You approve or ask for changes",
    body: "Open the item, read the notes, download the drawing. Approve it, or write exactly what needs to change — the team sees it straight away.",
  },
  {
    title: "Anything you need, you can raise",
    body: "Use \"Request work\" on any project. It reaches the team as a request; they accept it and schedule it against the job.",
  },
] as const;

export function PortalSupport() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    api.me().then(setSession).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-700 uppercase leading-none text-white">
          Support
        </h1>
        <p className="mt-2 text-sm font-medium text-white/55">
          How the portal works, and who to reach when you need a person.
        </p>
      </header>

      {/* ---------- how it works ---------- */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <header className="border-b border-white/[0.07] px-5 py-3.5">
          <h2 className="font-display text-base font-700 uppercase tracking-wide text-white">
            Using this portal
          </h2>
        </header>
        <ol className="divide-y divide-white/[0.06]">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="flex gap-4 px-5 py-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-green/15 font-display text-sm font-700 text-brand-green">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{s.title}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-white/55">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- contacts ---------- */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900 lg:col-span-1">
          <header className="border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="font-display text-base font-700 uppercase tracking-wide text-white">
              Talk to us
            </h2>
          </header>
          <div className="space-y-4 px-5 py-4">
            <a href={`mailto:${site.email}`}
              className="flex items-center gap-3 text-sm font-bold text-white transition-colors hover:text-brand-green">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <Mail className="size-4 text-brand-green" />
              </span>
              {site.email}
            </a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-3 text-sm font-bold text-white transition-colors hover:text-brand-green">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <Phone className="size-4 text-brand-green" />
              </span>
              {site.phone}
            </a>
            <p className="flex items-start gap-3 text-sm font-medium leading-relaxed text-white/55">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <Clock className="size-4 text-white/45" />
              </span>
              <span className="pt-1.5">
                Delivery hours are 09:00&ndash;18:00 IST, Monday to Saturday.
              </span>
            </p>
            <p className="flex items-start gap-3 text-sm font-medium leading-relaxed text-white/55">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                <MessageSquare className="size-4 text-white/45" />
              </span>
              <span className="pt-1.5">
                For anything tied to a drawing, comment on the item itself —
                it keeps the question next to the work.
              </span>
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900 lg:col-span-2">
          <header className="border-b border-white/[0.07] px-5 py-3.5">
            <h2 className="font-display text-base font-700 uppercase tracking-wide text-white">
              Our offices
            </h2>
          </header>
          <div className="grid divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {site.offices.map((o) => (
              <div key={o.country} className="px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-bold text-white">
                  <Building2 className="size-3.5 text-brand-green" />
                  {o.country}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-brand-green">
                  {o.role}
                </p>
                <address className="mt-2.5 space-y-0.5 text-xs font-medium not-italic leading-relaxed text-white/55">
                  {o.lines.map((l) => <span key={l} className="block">{l}</span>)}
                </address>
                <a href={`tel:${o.phone.replace(/\s/g, "")}`}
                  className="mt-2.5 inline-block text-xs font-bold text-white transition-colors hover:text-brand-green">
                  {o.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- account ---------- */}
      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-neutral-900 px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-green/15">
          <ShieldCheck className="size-4.5 text-brand-green" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {session ? session.organisation.name : <Loader2 className="size-4 animate-spin" />}
          </p>
          <p className="mt-0.5 text-xs font-medium text-white/50">
            Your project data is confidential and visible only to your account
            and the Mikan team working on it.
          </p>
        </div>
      </section>
    </div>
  );
}
