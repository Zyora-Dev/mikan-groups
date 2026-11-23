"use client";

import { useState } from "react";
import { ApplicationForm } from "@/components/application-form";
import { JobList } from "@/components/job-list";

export function CareersClient() {
  const [role, setRole] = useState<string | undefined>(undefined);
  const [key, setKey] = useState(0);

  function apply(title: string) {
    setRole(title);
    setKey((k) => k + 1); // remount so the Select picks up the new default
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section id="roles" className="container scroll-mt-44 py-20 md:py-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                Open roles
              </span>
            </div>
            <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-5xl">
              Where we&apos;re<br />hiring now
            </h2>
          </div>
          <p className="border-l-2 border-brand-green pl-6 text-lg leading-[1.7] text-foreground lg:self-center">
            All roles are based at our engineering delivery centre in Thuckalay,
            Kanyakumari. Expand a role to see the full brief.
          </p>
        </div>

        <div className="mt-12">
          <JobList onApply={apply} />
        </div>
      </section>

      <section id="apply" className="scroll-mt-44 border-t border-border bg-secondary/25 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                Application
              </span>
            </div>
            <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-4xl">
              Send us your CV
            </h2>
            <p className="mt-5 text-lg leading-[1.7] text-foreground/80">
              Applying for a specific role, or sending an open application — both
              reach the same engineering team.
            </p>

            <div className="mt-10">
              <ApplicationForm key={key} defaultRole={role} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
