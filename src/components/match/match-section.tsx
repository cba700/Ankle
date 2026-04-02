"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import styles from "./match-section.module.css";

type MatchSectionProps = {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function MatchSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: MatchSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`${styles.section} ${open ? styles.sectionOpen : ""}`}>
      <button
        className={`${styles.header} ${collapsible ? styles.headerInteractive : styles.headerStatic}`}
        disabled={!collapsible}
        onClick={collapsible ? () => setOpen((current) => !current) : undefined}
        type="button"
      >
        <span className={styles.title}>{title}</span>
        {collapsible ? <ChevronDownIcon className={styles.toggleIcon} /> : null}
      </button>
      {(!collapsible || open) && <div className={styles.body}>{children}</div>}
    </section>
  );
}

