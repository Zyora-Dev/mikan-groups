import Link from "next/link";
import { ArrowRight, Building2, FileText, Users } from "lucide-react";

const CARDS = [
  {
    href: "/internal/erp/team/members",
    Icon: Users,
    title: "Team members",
    body: "Add engineers and administrators to the Mikan organisation.",
    ready: true,
  },
  {
    href: "/internal/erp/team/clients",
    Icon: Building2,
    title: "Client organisations",
    body: "Create client companies and invite the people who work with you.",
    ready: true,
  },
  {
    href: "/internal/erp/team/projects",
    Icon: FileText,
    title: "Drawing register",
    body: "Projects, drawings, revisions and issue status.",
    ready: false,
  },
];

export function TeamHome() {
  return (
    <div>
      <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
        Dashboard
      </h1>
      <p className="mt-3 text-base font-medium text-white/65">
        Mikan Engineering &amp; Construction
      </p>

      <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-3">
        {CARDS.map(({ href, Icon, title, body, ready }) =>
          ready ? (
            <Link key={title} href={href}
              className="group bg-neutral-900 p-8 transition-colors hover:bg-neutral-800">
              <Icon className="size-6 text-brand-green" />
              <h2 className="mt-5 font-display text-lg font-700 uppercase leading-tight text-white">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-green">
                Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ) : (
            <div key={title} className="bg-neutral-900 p-8">
              <Icon className="size-6 text-white/35" />
              <h2 className="mt-5 font-display text-lg font-700 uppercase leading-tight text-white/70">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">{body}</p>
              <span className="mt-5 inline-block border border-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white/40">
                Next to build
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
